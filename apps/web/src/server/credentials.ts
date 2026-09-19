import { and, eq } from "drizzle-orm";
import { UserError } from "./errors";
import { audit, notify, notifyAll, ownersOf } from "./notify";
import { assertOrgRole } from "./authz";
import { briefVersions, credentials, enrollments, organizations, projects, user, type Db } from "@iq/db";
import type { Actor } from "./authz";
import { Forbidden } from "./errors";

// PRD §16.1: public verification is student-initiated and can be revoked at any time (AC-19).
export async function setCredentialPublic(db: Db, actor: Actor, input: { credentialId: string; isPublic: boolean; days?: number }) {
  const publicUntil = input.isPublic && input.days ? new Date(Date.now() + input.days * 864e5) : null; // CRD-06
  const res = await db.update(credentials).set({ isPublic: input.isPublic, publicUntil })
    .where(and(eq(credentials.id, input.credentialId), eq(credentials.userId, actor.id))).returning();
  if (!res.length) throw new Forbidden();
}

// CRD-02 and AC-14: the public page gets the approved summary and permitted identity fields only.
// No files, no scores, no private feedback, no confidential company material.
export async function publicCredential(db: Db, id: string, viewer: Actor | null) {
  const [row] = await db.select({
    c: credentials, holder: user.name, project: briefVersions.title, tier: briefVersions.tier,
    org: organizations.name, mentorId: enrollments.mentorId, completedAt: enrollments.completedAt,
  }).from(credentials)
    .innerJoin(user, eq(user.id, credentials.userId))
    .leftJoin(enrollments, eq(enrollments.id, credentials.enrollmentId))
    .leftJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .leftJoin(projects, eq(projects.id, enrollments.projectId))
    .leftJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(credentials.id, id)).catch(() => []);
  const live = row?.c.isPublic && (!row.c.publicUntil || row.c.publicUntil > new Date());
  if (!row || (!live && row.c.userId !== viewer?.id)) return null;
  const [mentor] = row.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, row.mentorId)) : [];
  return { ...row, mentor: mentor?.name ?? null };
}

// CRD-03: the student writes what they did; the company checks it holds nothing confidential.
export async function proposeSummary(db: Db, actor: Actor, input: { credentialId: string; summary: string }) {
  const summary = input.summary.trim();
  if (summary.length < 30) throw new UserError("Describe your contribution in a few sentences.");
  const [c] = await db.select({ c: credentials, orgId: projects.orgId, title: briefVersions.title }).from(credentials)
    .innerJoin(enrollments, eq(enrollments.id, credentials.enrollmentId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .where(and(eq(credentials.id, input.credentialId), eq(credentials.userId, actor.id), eq(credentials.kind, "completion")));
  if (!c) throw new UserError("Only project completions take a portfolio summary.");
  await db.update(credentials).set({ proposedSummary: summary.slice(0, 1500), summaryStatus: "pending", summaryReviewedBy: null }).where(eq(credentials.id, c.c.id));
  await notifyAll(db, await ownersOf(db, c.orgId), { kind: "portfolio", title: `Portfolio summary to approve: ${c.title}`,
    body: "A student wants to show their contribution publicly. Check it holds nothing confidential.", href: "/company#portfolio", key: `summary:${c.c.id}:${Date.now()}` });
}

export async function reviewSummary(db: Db, actor: Actor, input: { credentialId: string; approve: boolean; note: string }) {
  const [c] = await db.select({ c: credentials, orgId: projects.orgId }).from(credentials)
    .innerJoin(enrollments, eq(enrollments.id, credentials.enrollmentId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .where(eq(credentials.id, input.credentialId));
  if (!c || c.c.summaryStatus !== "pending") throw new UserError("Nothing to review.");
  await assertOrgRole(db, actor, c.orgId, "owner");
  if (!input.approve && input.note.trim().length < 5) throw new UserError("Say what needs to change.");
  await db.update(credentials).set({ summaryStatus: input.approve ? "approved" : "declined", summaryReviewedBy: actor.id }).where(eq(credentials.id, c.c.id));
  await audit(db, actor.id, input.approve ? "portfolio_summary_approved" : "portfolio_summary_declined", "credential", c.c.id, input.note.trim() || undefined);
  await notify(db, { userId: c.c.userId, kind: "portfolio", essential: true,
    title: input.approve ? "Your portfolio summary was approved" : "Your portfolio summary needs changes",
    body: input.note.trim(), href: "/profile?tab=credentials", key: `summary-review:${c.c.id}:${Date.now()}` });
}
