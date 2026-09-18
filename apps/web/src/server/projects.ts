import { and, eq } from "drizzle-orm";
import { TIER_XP, canPublish, nextListing, type Brief } from "@iq/core";
import { briefVersions, memberships, organizations, projects, type Db } from "@iq/db";
import { assertOrgRole, assertStaff, type Actor } from "./authz";
import { Forbidden, UserError } from "./errors";

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
    });
  }
  const { project } = await loadProject(db, input.projectId);
  if (project.orgId !== input.orgId) throw new Forbidden();
  if (project.state !== "draft" && project.state !== "changes_requested")
    throw new UserError("This brief is in review or published, so it can't be edited here.");
  await db.update(briefVersions).set(versionFields(input.brief)).where(eq(briefVersions.id, project.currentVersionId!));
  await db.update(projects).set({ updatedAt: new Date() }).where(eq(projects.id, project.id));
  return project.id;
}

export async function submitForReview(db: Db, actor: Actor, projectId: string) {
  const { project, brief, org } = await loadProject(db, projectId);
  await assertOrgRole(db, actor, project.orgId, "owner");
  const errors = canPublish(brief.content, { verified: !!org.verifiedAt });
  if (errors.length) throw new UserError(`Fix these before submitting: ${errors.join(" ")}`);
  await db.update(projects).set({ state: nextListing(project.state, "submitForReview"), updatedAt: new Date() }).where(eq(projects.id, projectId));
}

// PRD §9.2: staff are the publication quality gate. The automatic checks run again at approval.
export async function reviewProject(db: Db, actor: Actor, input: { projectId: string; approve: boolean; note: string }) {
  await assertStaff(db, actor);
  const { project, brief, org } = await loadProject(db, input.projectId);
  if (input.approve) {
    const errors = canPublish(brief.content, { verified: !!org.verifiedAt });
    if (errors.length) throw new UserError(`Can't publish yet: ${errors.join(" ")}`);
  } else if (!input.note.trim()) throw new UserError("Say what needs to change so the owner can fix it.");
  const state = nextListing(project.state, input.approve ? "approve" : "requestChanges");
  await db.update(projects).set({ state, reviewNote: input.note.trim() || null, updatedAt: new Date() }).where(eq(projects.id, project.id));
}

export async function verifyOrg(db: Db, actor: Actor, orgId: string) {
  await assertStaff(db, actor);
  await db.update(organizations).set({ verifiedAt: new Date(), verifiedBy: actor.id }).where(eq(organizations.id, orgId));
}
