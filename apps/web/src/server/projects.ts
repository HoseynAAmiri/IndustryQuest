import { and, eq, inArray, max } from "drizzle-orm";
import { TIER_XP, briefDiff, briefSchema, canPublish, nextListing, type Brief } from "@iq/core";
import { briefVersions, enrollments, memberships, organizations, projects, type Db } from "@iq/db";
import { assertOrgRole, assertStaff, getRoles, type Actor } from "./authz";
import { Forbidden, UserError } from "./errors";
import { audit, notify, notifyAll, ownersOf, staffIds } from "./notify";

export async function loadProject(db: Db, projectId: string) {
  const [row] = await db
    .select({ project: projects, brief: briefVersions, org: organizations })
    .from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(projects.id, projectId));
  if (!row) throw new UserError("Project not found.");
  return row;
}

async function assertMentorOf(db: Db, orgId: string, mentorId: string) {
  if (!mentorId) return;
  const [m] = await db.select().from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.userId, mentorId), eq(memberships.role, "mentor")));
  if (!m) throw new UserError("The mentor must be a mentor in your organization.");
}

const versionFields = (b: Brief) => ({
  title: b.title, summary: b.summary, tier: b.tier, beginner: b.beginner, capacity: b.capacity,
  xp: TIER_XP[b.tier], mentorId: b.mentorId || null, content: b,
});

// Before publication a project has one version that is edited in place: nobody has accepted it yet.
// ponytail: published briefs are frozen; editing them needs a new version + participant consent (PRJ-10, AC-06).
export async function saveDraft(db: Db, actor: Actor, input: { projectId?: string; orgId: string; brief: Brief }) {
  await assertOrgRole(db, actor, input.orgId, "owner");
  await assertMentorOf(db, input.orgId, input.brief.mentorId);
  if (!input.projectId) {
    return db.transaction(async (tx) => {
      const [p] = await tx.insert(projects).values({ orgId: input.orgId, ownerId: actor.id }).returning();
      const [v] = await tx.insert(briefVersions).values({ projectId: p.id, version: 1, createdBy: actor.id, ...versionFields(input.brief) }).returning();
      await tx.update(projects).set({ currentVersionId: v.id }).where(eq(projects.id, p.id));
      return p.id;
    }).then(async (id) => { await askMentor(db, id, input.brief); return id; });
  }
  const { project } = await loadProject(db, input.projectId);
  if (project.orgId !== input.orgId) throw new Forbidden();
  if (project.state !== "draft" && project.state !== "changes_requested")
    throw new UserError("This brief is in review or published, so it can't be edited here.");
  const { brief: before } = await loadProject(db, project.id);
  await db.update(briefVersions).set(versionFields(input.brief)).where(eq(briefVersions.id, project.currentVersionId!));
  const mentorChanged = before.mentorId !== (input.brief.mentorId || null);
  await db.update(projects).set({ updatedAt: new Date(), ...(mentorChanged && { mentorConfirmedAt: null }) }).where(eq(projects.id, project.id));
  if (mentorChanged) await askMentor(db, project.id, input.brief);
  return project.id;
}

async function askMentor(db: Db, projectId: string, b: Brief) {
  if (b.mentorId) await notify(db, { userId: b.mentorId, kind: "mentoring", essential: true, title: `Asked to mentor: ${b.title || "a new brief"}`,
    body: `About ${b.mentorHours} hours per student. Confirm only if you can support it.`, href: "/mentor", key: `ask-mentor:${projectId}:${b.mentorId}:${Date.now()}` });
}

// MEN-02: the named mentor confirms before the brief can go out.
export async function confirmMentoring(db: Db, actor: Actor, projectId: string) {
  const { project, brief } = await loadProject(db, projectId);
  if (brief.mentorId !== actor.id) throw new Forbidden("Only the named mentor can confirm.");
  await db.update(projects).set({ mentorConfirmedAt: new Date() }).where(eq(projects.id, projectId));
  await audit(db, actor.id, "mentoring_confirmed", "project", projectId);
  await notifyAll(db, await ownersOf(db, project.orgId), { kind: "mentoring", title: `Mentor confirmed: ${brief.title}`, href: `/company/projects/${projectId}`, key: `mentor-ok:${projectId}:${actor.id}` });
}

const gate = (b: Brief, p: { mentorConfirmedAt: Date | null }, org: { verifiedAt: Date | null }) =>
  canPublish(briefSchema.parse(b), { verified: !!org.verifiedAt, mentorConfirmed: !!p.mentorConfirmedAt });

export async function submitForReview(db: Db, actor: Actor, projectId: string) {
  const { project, brief, org } = await loadProject(db, projectId);
  await assertOrgRole(db, actor, project.orgId, "owner");
  const errors = gate(brief.content, project, org);
  if (errors.length) throw new UserError(`Fix these before submitting: ${errors.join(" ")}`);
  await db.update(projects).set({ state: nextListing(project.state, "submitForReview"), updatedAt: new Date() }).where(eq(projects.id, projectId));
  await notifyAll(db, await staffIds(db), { kind: "staff", title: `Brief to review: ${brief.title}`, href: `/staff/projects/${projectId}`, key: `brief-review:${brief.id}:${Date.now()}` });
}

// PRD §9.2: staff are the publication quality gate. The automatic checks run again at approval.
export async function reviewProject(db: Db, actor: Actor, input: { projectId: string; approve: boolean; note: string }) {
  await assertStaff(db, actor);
  const { project, brief, org } = await loadProject(db, input.projectId);
  if (input.approve) {
    const errors = gate(brief.content, project, org);
    if (errors.length) throw new UserError(`Can't publish yet: ${errors.join(" ")}`);
  } else if (!input.note.trim()) throw new UserError("Say what needs to change so the owner can fix it.");
  const state = nextListing(project.state, input.approve ? "approve" : "requestChanges");
  await db.update(projects).set({ state, reviewNote: input.note.trim() || null, updatedAt: new Date() }).where(eq(projects.id, project.id));
  await audit(db, actor.id, input.approve ? "brief_approved" : "brief_changes_requested", "project", project.id, input.note.trim() || undefined);
  await notifyAll(db, await ownersOf(db, project.orgId), {
    kind: "brief", essential: true, title: input.approve ? `Published: ${brief.title}` : `Changes requested: ${brief.title}`,
    body: input.note.trim(), href: `/company/projects/${project.id}`, key: `brief-decision:${project.id}:${Date.now()}`,
  });
}

export async function verifyOrg(db: Db, actor: Actor, orgId: string) {
  await assertStaff(db, actor);
  await db.update(organizations).set({ verifiedAt: new Date(), verifiedBy: actor.id }).where(eq(organizations.id, orgId));
  await audit(db, actor.id, "organization_verified", "organization", orgId);
  await notifyAll(db, await ownersOf(db, orgId), { kind: "org", essential: true, title: "Your organization is verified", body: "You can now submit briefs for review.", href: "/company", key: `org-verified:${orgId}` });
}

// PRJ-11: pause, reopen or close with a reason; people waiting on the project are told.
export async function setListingState(db: Db, actor: Actor, input: { projectId: string; action: "pause" | "resume" | "close"; reason: string }) {
  const { project, brief, org } = await loadProject(db, input.projectId);
  const roles = await getRoles(db, actor.id);
  if (!roles.isStaff && !roles.ownerOf.includes(project.orgId)) throw new Forbidden();
  if (input.action !== "resume" && input.reason.trim().length < 5) throw new UserError("Give a short reason. Applicants will see it.");
  if (input.action === "resume" && gate(brief.content, project, org).length) throw new UserError("Fix the brief's missing details before reopening.");
  const state = nextListing(project.state, input.action);
  await db.update(projects).set({ state, stateReason: input.reason.trim() || null, updatedAt: new Date() }).where(eq(projects.id, project.id));
  await audit(db, actor.id, `listing_${input.action}`, "project", project.id, input.reason.trim() || undefined);
  const waiting = await db.select({ id: enrollments.studentId }).from(enrollments)
    .where(and(eq(enrollments.projectId, project.id), inArray(enrollments.state, ["applied", "offered"])));
  if (input.action !== "resume")
    await notifyAll(db, waiting.map((w) => w.id), {
      kind: "project", essential: true, title: `${brief.title} is ${state === "paused" ? "paused" : "closed"}`,
      body: `${input.reason.trim()} Your application stays on file${state === "closed" ? " until the company decides" : ""}.`,
      href: `/projects/${project.id}`, key: `listing:${project.id}:${input.action}:${Date.now()}`,
    });
}

// PRJ-10/15, AC-06: a published brief never changes in place. Editing creates a new version for new
// applicants; students already working keep the version they accepted unless they agree to the change.
export async function reviseBrief(db: Db, actor: Actor, input: { projectId: string; brief: Brief; reason: string; material: boolean }) {
  const { project, brief: current, org } = await loadProject(db, input.projectId);
  await assertOrgRole(db, actor, project.orgId, "owner");
  if (project.state !== "published" && project.state !== "paused") throw new UserError("Only live briefs are revised this way.");
  if ((input.brief.mentorId || null) !== current.mentorId) throw new UserError("To change the mentor, ask program staff; the new mentor has to confirm first.");
  const errors = gate(input.brief, project, org);
  if (errors.length) throw new UserError(`Fix these first: ${errors.join(" ")}`);
  const changed = briefDiff(briefSchema.parse(current.content), input.brief);
  if (!changed.length) throw new UserError("Nothing that students agreed to has changed.");
  if (input.reason.trim().length < 10) throw new UserError("Explain why the brief is changing. Enrolled students will read this.");
  const [{ v }] = await db.select({ v: max(briefVersions.version) }).from(briefVersions).where(eq(briefVersions.projectId, project.id));
  const [next] = await db.insert(briefVersions).values({ projectId: project.id, version: (v ?? 0) + 1, createdBy: actor.id, ...versionFields(input.brief) }).returning();
  await db.update(projects).set({ currentVersionId: next.id, updatedAt: new Date() }).where(eq(projects.id, project.id));
  await audit(db, actor.id, "brief_revised", "project", project.id, input.reason.trim(), { version: next.version, changed, material: input.material });
  if (!input.material) return next.version;
  const affected = await db.update(enrollments).set({ proposedVersionId: next.id, proposalReason: input.reason.trim(), updatedAt: new Date() })
    .where(and(eq(enrollments.projectId, project.id), inArray(enrollments.state, ["active", "revision_requested"]))).returning();
  for (const e of affected)
    await notify(db, { userId: e.studentId, kind: "scope", essential: true, title: `Proposed change to ${input.brief.title}`,
      body: `Changes: ${changed.join(", ")}. Nothing changes for you unless you agree.`, href: `/workspace/${e.id}`, key: `scope:${e.id}:${next.id}` });
  return next.version;
}
