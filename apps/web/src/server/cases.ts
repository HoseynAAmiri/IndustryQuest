import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { nextEnrollment } from "@iq/core";
import { assessments, caseUpdates, cases, enrollments, memberships, milestones, projects, submissions, type Db } from "@iq/db";
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
} as const;
export type CaseType = keyof typeof CASE_TYPES;
const RESPONSE_DAYS = 5; // expected reply, in calendar days

export async function openCase(db: Db, actor: Actor, input: { type: CaseType; enrollmentId?: string; summary: string; requestedDays?: number; skillId?: string }) {
  if (!(input.type in CASE_TYPES)) throw new UserError("Choose what the request is about.");
  const summary = input.summary.trim();
  if (summary.length < 10) throw new UserError("Tell us a little more so staff can help.");
  if (input.enrollmentId) {
    if ((await enrollmentAccess(db, actor, input.enrollmentId)) !== "student") throw new Forbidden();
  } else if (input.type !== "support" && input.type !== "equivalency") throw new UserError("Open this from the project it's about.");
  if (input.type === "equivalency" && !input.skillId) throw new UserError("Say which skill the evidence is for.");
  if (input.type === "appeal") {
    const [e] = await db.select({ state: enrollments.state }).from(enrollments).where(eq(enrollments.id, input.enrollmentId!));
    if (!["closed_incomplete", "completed"].includes(e.state)) throw new UserError("You can appeal once a decision has been made.");
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
  | { kind: "reopen" }
  | { kind: "close" }
  | { kind: "grant_equivalency" };

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
  } else if (a.kind !== "none" && !c.enrollmentId) throw new UserError("That action needs a project.");

  await db.transaction(async (tx) => {
    const eid = c.enrollmentId!;
    if (a.kind === "extend") {
      const days = Math.max(1, Math.min(60, Math.round(a.days)));
      const i = sql`${days} * interval '1 day'`;
      await tx.update(milestones).set({ dueAt: sql`${milestones.dueAt} + ${i}` }).where(and(eq(milestones.enrollmentId, eid), isNull(milestones.doneAt)));
      await tx.execute(sql`update assessments set revision_due_at = revision_due_at + ${i}
        where revision_due_at is not null and submission_id in (select id from submissions where enrollment_id = ${eid})`);
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
