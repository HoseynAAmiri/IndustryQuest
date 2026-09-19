import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { nextEnrollment } from "@iq/core";
import { account, assessments, blockedUsers, caseUpdates, cases, enrollments, memberships, milestones, projects, session, skillClaims, studentProfiles, submissions, user, type Db } from "@iq/db";
import { getRoles, type Actor } from "./authz";
import { Forbidden, UserError } from "./errors";
import { audit, notify, notifyAll, staffIds, track } from "./notify";
import { grantEquivalency } from "./staff";
import { enrollmentAccess } from "./workspace";

export const CASE_TYPES = {
  blocker: "I'm blocked",
  extension: "I need more time",
  conduct: "A problem with the company or mentor",
  support: "Account or other help",
  appeal: "Appeal a decision",
  equivalency: "Equivalency review",
  mentor_feedback: "Private mentor feedback",
  project_feedback: "Private project feedback",
  reviewer_conflict: "Reviewer conflict",
  deletion: "Account deletion request",
} as const;
export type CaseType = keyof typeof CASE_TYPES;
const RESPONSE_DAYS = 5; // expected reply, in calendar days

export async function openCase(db: Db, actor: Actor, input: { type: CaseType; enrollmentId?: string; summary: string; requestedDays?: number; skillId?: string }) {
  if (!(input.type in CASE_TYPES)) throw new UserError("Choose what the request is about.");
  const summary = input.summary.trim();
  if (summary.length < 10) throw new UserError("Tell us a little more so staff can help.");
  if (input.enrollmentId) {
    const access = await enrollmentAccess(db, actor, input.enrollmentId);
    if (input.type === "reviewer_conflict" ? access !== "mentor" : access !== "student") throw new Forbidden();
  } else if (!["support", "equivalency", "deletion"].includes(input.type)) throw new UserError("Open this from the project it's about.");
  if (input.type === "equivalency" && !input.skillId) throw new UserError("Say which skill the evidence is for.");
  if (input.type === "appeal") {
    const [e] = await db.select({ state: enrollments.state }).from(enrollments).where(eq(enrollments.id, input.enrollmentId!));
    if (!["closed_incomplete", "completed"].includes(e.state)) throw new UserError("You can appeal once a decision has been made.");
  }
  if (["mentor_feedback", "project_feedback"].includes(input.type)) {
    const [e] = await db.select({ state: enrollments.state }).from(enrollments).where(eq(enrollments.id, input.enrollmentId!));
    if (e?.state !== "completed") throw new UserError("Feedback opens after the project is completed.");
    const prior = await db.select({ id: cases.id }).from(cases).where(and(eq(cases.reporterId, actor.id), eq(cases.enrollmentId, input.enrollmentId!), eq(cases.type, input.type))).limit(1);
    if (prior.length) throw new UserError("You already sent this feedback.");
  }
  if (input.type === "reviewer_conflict") {
    const [e] = await db.select({ state: enrollments.state }).from(enrollments).where(eq(enrollments.id, input.enrollmentId!));
    if (e?.state !== "submitted") throw new UserError("A reviewer conflict can be raised while work is waiting for review.");
  }
  const days = input.type === "extension" ? Math.max(1, Math.min(30, Math.round(input.requestedDays ?? 7))) : null;
  const [c] = await db.insert(cases).values({
    type: input.type, reporterId: actor.id, enrollmentId: input.enrollmentId ?? null, summary: summary.slice(0, 4000),
    requestedDays: days, skillId: input.type === "equivalency" ? input.skillId : null, dueAt: new Date(Date.now() + RESPONSE_DAYS * 864e5),
  }).returning();
  await track(db, "case_opened", c.id, null, { type: c.type }); // no narrative in analytics (§19.1)
  await notifyAll(db, await staffIds(db), { kind: "case", title: `New ${c.type} case #${c.number}`, href: `/staff/cases/${c.id}`, key: `case-open:${c.id}` });
  await notify(db, { userId: actor.id, kind: "case", essential: true, title: `We got your request (#${c.number})`,
    body: `Staff will reply by ${c.dueAt.toISOString().slice(0, 10)}. Only you and program staff can see it.`, href: "/support", key: `case-ack:${c.id}` });
  return c;
}

async function loadCase(db: Db, actor: Actor, caseId: string) {
  const [c] = await db.select().from(cases).where(eq(cases.id, caseId));
  if (!c) throw new Forbidden();
  const staff = (await getRoles(db, actor.id)).isStaff;
  if (!staff && c.reporterId !== actor.id) throw new Forbidden();
  return { c, staff };
}

export async function addCaseUpdate(db: Db, actor: Actor, input: { caseId: string; body: string }) {
  const { c, staff } = await loadCase(db, actor, input.caseId);
  if (!input.body.trim()) throw new UserError("Write an update first.");
  await db.insert(caseUpdates).values({ caseId: c.id, authorId: actor.id, body: input.body.trim().slice(0, 4000) });
  await db.update(cases).set({ updatedAt: new Date(), ...(staff && c.status === "open" && { status: "in_progress" as const, ownerId: c.ownerId ?? actor.id }) })
    .where(eq(cases.id, c.id));
  if (staff) await notify(db, { userId: c.reporterId, kind: "case", title: `Update on request #${c.number}`, href: "/support", key: `case-upd:${c.id}:${Date.now()}` });
}

export async function takeCase(db: Db, actor: Actor, caseId: string) {
  const { c, staff } = await loadCase(db, actor, caseId);
  if (!staff) throw new Forbidden();
  await db.update(cases).set({ ownerId: actor.id, status: c.status === "open" ? "in_progress" : c.status, updatedAt: new Date() }).where(eq(cases.id, c.id));
}

// OPS-13: whoever made the disputed decision (or mentors that project) can't decide the appeal.
async function involvedIn(db: Db, enrollmentId: string) {
  const rows = await db.select({ assessor: assessments.assessorId }).from(assessments)
    .innerJoin(submissions, eq(submissions.id, assessments.submissionId)).where(eq(submissions.enrollmentId, enrollmentId));
  const [e] = await db.select({ mentor: enrollments.mentorId }).from(enrollments).where(eq(enrollments.id, enrollmentId));
  return new Set([...rows.map((r) => r.assessor), e?.mentor].filter(Boolean));
}

export type Resolution =
  | { kind: "none" }
  | { kind: "extend"; days: number }
  | { kind: "replace_mentor"; mentorId: string }
  | { kind: "pause"; days: number }
  | { kind: "reopen" }
  | { kind: "close" }
  | { kind: "grant_equivalency" }
  | { kind: "delete_account" };

// OPS-05: every staff intervention records who, what and why.
export async function resolveCase(db: Db, actor: Actor, input: { caseId: string; resolution: string; action: Resolution }) {
  const { c, staff } = await loadCase(db, actor, input.caseId);
  if (!staff) throw new Forbidden();
  if (c.status === "resolved") throw new UserError("This case is already resolved.");
  if (input.resolution.trim().length < 10) throw new UserError("Write the resolution the reporter will read.");
  if (c.type === "appeal" && c.enrollmentId && (await involvedIn(db, c.enrollmentId)).has(actor.id))
    throw new Forbidden("You took part in the decision under appeal, so another staff member has to decide it.");
  const a = input.action;
  if (a.kind === "grant_equivalency") {
    if (!c.skillId) throw new UserError("This case has no skill to grant.");
    await grantEquivalency(db, actor, { userId: c.reporterId, skillId: c.skillId, evidence: input.resolution, caseId: c.id });
  } else if (a.kind !== "none" && a.kind !== "delete_account" && !c.enrollmentId) throw new UserError("That action needs a project.");
  if (a.kind === "delete_account" && c.type !== "deletion") throw new UserError("Account deletion needs a deletion request.");

  await db.transaction(async (tx) => {
    const eid = c.enrollmentId!;
    if (a.kind === "extend" || a.kind === "pause") {
      const days = Math.max(1, Math.min(60, Math.round(a.days)));
      const i = sql`${days} * interval '1 day'`;
      await tx.update(milestones).set({ dueAt: sql`${milestones.dueAt} + ${i}` }).where(and(eq(milestones.enrollmentId, eid), isNull(milestones.doneAt)));
      await tx.execute(sql`update assessments set revision_due_at = revision_due_at + ${i}
        where revision_due_at is not null and submission_id in (select id from submissions where enrollment_id = ${eid})`);
      if (a.kind === "pause") await tx.update(enrollments).set({ pausedUntil: new Date(Date.now() + days * 864e5), pauseReason: input.resolution.trim(), updatedAt: new Date() })
        .where(eq(enrollments.id, eid));
    }
    if (a.kind === "replace_mentor") {
      const [row] = await tx.select({ orgId: projects.orgId }).from(enrollments).innerJoin(projects, eq(projects.id, enrollments.projectId)).where(eq(enrollments.id, eid));
      const [m] = await tx.select().from(memberships).where(and(eq(memberships.orgId, row.orgId), eq(memberships.userId, a.mentorId), eq(memberships.role, "mentor")));
      if (!m) throw new UserError("Pick a mentor from the project's company.");
      await tx.update(enrollments).set({ mentorId: a.mentorId, updatedAt: new Date() }).where(eq(enrollments.id, eid));
    }
    if (a.kind === "reopen" || a.kind === "close") {
      const [e] = await tx.select().from(enrollments).where(eq(enrollments.id, eid)).for("update");
      await tx.update(enrollments).set({ state: nextEnrollment(e.state, a.kind), updatedAt: new Date() }).where(eq(enrollments.id, eid));
    }
    if (a.kind === "delete_account") {
      await tx.delete(session).where(eq(session.userId, c.reporterId));
      await tx.delete(account).where(eq(account.userId, c.reporterId));
      await tx.delete(skillClaims).where(eq(skillClaims.userId, c.reporterId));
      await tx.update(studentProfiles).set({ bio: "", pronouns: "", discipline: "", interests: [], goals: "", visibility: "private", shareToken: null })
        .where(eq(studentProfiles.userId, c.reporterId));
      await tx.update(user).set({ name: "Deleted user", email: `deleted+${c.reporterId}@invalid.local`, image: null, deletedAt: new Date(), updatedAt: new Date() })
        .where(eq(user.id, c.reporterId));
    }
    await tx.update(cases).set({
      status: "resolved", resolution: input.resolution.trim(), resolvedBy: actor.id, resolvedAt: new Date(), ownerId: c.ownerId ?? actor.id, updatedAt: new Date(),
    }).where(eq(cases.id, c.id));
    await audit(tx, actor.id, `case_resolved:${a.kind}`, "case", c.id, input.resolution.trim(), { enrollmentId: c.enrollmentId, ...a });
  });
  await track(db, "case_resolved", c.id, null, { type: c.type, action: a.kind });
  await notify(db, { userId: c.reporterId, kind: "case", essential: true, title: `Request #${c.number} resolved`, body: input.resolution.trim(), href: "/support", key: `case-done:${c.id}` });
  if (a.kind === "replace_mentor") await notify(db, { userId: a.mentorId, kind: "enrollment", essential: true, title: "You've been assigned a mentee", href: `/workspace/${c.enrollmentId}`, key: `mentor-assign:${c.enrollmentId}:${a.mentorId}` });
}

export async function openCaseCount(db: Db) {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(cases).where(inArray(cases.status, ["open", "in_progress"]));
  return r.n;
}

export async function blockContact(db: Db, actor: Actor, input: { enrollmentId: string; userId: string; reason: string }) {
  if ((await enrollmentAccess(db, actor, input.enrollmentId)) !== "student") throw new Forbidden();
  const [e] = await db.select({ mentorId: enrollments.mentorId, ownerId: projects.ownerId }).from(enrollments)
    .innerJoin(projects, eq(projects.id, enrollments.projectId)).where(eq(enrollments.id, input.enrollmentId));
  if (!e || ![e.mentorId, e.ownerId].includes(input.userId)) throw new UserError("You can restrict the assigned mentor or company contact from this workspace.");
  if (input.reason.trim().length < 10) throw new UserError("Tell staff what happened so they can arrange safe next steps.");
  await db.insert(blockedUsers).values({ blockerId: actor.id, blockedId: input.userId, enrollmentId: input.enrollmentId }).onConflictDoNothing();
  await audit(db, actor.id, "contact_blocked", "user", input.userId, undefined, { enrollmentId: input.enrollmentId });
  return openCase(db, actor, { type: "conduct", enrollmentId: input.enrollmentId, summary: `Contact restricted. ${input.reason.trim()}` });
}
