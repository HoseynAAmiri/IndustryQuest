import { asc, desc, eq, max } from "drizzle-orm";
import { nextEnrollment } from "@iq/core";
import {
  assessments, briefVersions, enrollments, files, messages, milestones, organizations, projects, submissions, user, type Db,
} from "@iq/db";
import { getRoles, type Actor } from "./authz";
import { Forbidden, UserError } from "./errors";
import { audit, notify, track } from "./notify";

export type Access = "student" | "mentor" | "owner" | "staff";

// AC-08: the one gate for every enrollment read and write, including file downloads.
// A mentor only gets in while assigned; a former mentor or another org's owner does not.
export async function enrollmentAccess(db: Db, actor: Actor, enrollmentId: string): Promise<Access> {
  const [row] = await db.select({ e: enrollments, orgId: projects.orgId }).from(enrollments)
    .innerJoin(projects, eq(projects.id, enrollments.projectId)).where(eq(enrollments.id, enrollmentId));
  if (!row) throw new Forbidden();
  if (row.e.studentId === actor.id) return "student";
  if (row.e.mentorId === actor.id) return "mentor";
  const roles = await getRoles(db, actor.id);
  if (roles.ownerOf.includes(row.orgId)) return "owner";
  if (roles.isStaff) {
    // Staff access is purpose-bound and always logged (§16.1, OPS-07).
    await audit(db, actor.id, "staff_accessed_enrollment", "enrollment", enrollmentId);
    return "staff";
  }
  throw new Forbidden();
}

export async function loadWorkspace(db: Db, actor: Actor, enrollmentId: string) {
  const access = await enrollmentAccess(db, actor, enrollmentId);
  const [row] = await db.select({ e: enrollments, v: briefVersions, org: organizations, student: user })
    .from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(eq(enrollments.id, enrollmentId));
  const [mentor] = row.e.mentorId ? await db.select().from(user).where(eq(user.id, row.e.mentorId)) : [];
  const [ms, msgs, fs, subs] = await Promise.all([
    db.select().from(milestones).where(eq(milestones.enrollmentId, enrollmentId)).orderBy(asc(milestones.dueAt)),
    db.select({ m: messages, author: user.name }).from(messages).innerJoin(user, eq(user.id, messages.authorId))
      .where(eq(messages.enrollmentId, enrollmentId)).orderBy(asc(messages.createdAt)),
    db.select({ f: files, by: user.name }).from(files).innerJoin(user, eq(user.id, files.uploaderId))
      .where(eq(files.enrollmentId, enrollmentId)).orderBy(desc(files.createdAt)),
    db.select({ s: submissions, a: assessments, assessor: user.name }).from(submissions)
      .leftJoin(assessments, eq(assessments.submissionId, submissions.id))
      .leftJoin(user, eq(user.id, assessments.assessorId))
      .where(eq(submissions.enrollmentId, enrollmentId)).orderBy(desc(submissions.version)),
  ]);
  return { access, ...row, mentor, milestones: ms, messages: msgs, files: fs, submissions: subs };
}

const WORKING = ["active", "revision_requested"];

export async function postMessage(db: Db, actor: Actor, input: { enrollmentId: string; body: string }) {
  await enrollmentAccess(db, actor, input.enrollmentId);
  const body = input.body.trim();
  if (!body) throw new UserError("Write a message first.");
  const [m] = await db.insert(messages).values({ enrollmentId: input.enrollmentId, authorId: actor.id, body: body.slice(0, 4000) }).returning();
  const [e] = await db.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId));
  const to = e.studentId === actor.id ? e.mentorId : e.studentId;
  if (to) await notify(db, { userId: to, kind: "message", title: "New message on your project", href: `/workspace/${e.id}?tab=discussion`, key: `msg:${e.id}:${m.id}` });
}

export async function toggleMilestone(db: Db, actor: Actor, milestoneId: string) {
  const [m] = await db.select().from(milestones).where(eq(milestones.id, milestoneId));
  if (!m || (await enrollmentAccess(db, actor, m.enrollmentId)) !== "student") throw new Forbidden();
  await db.update(milestones).set({ doneAt: m.doneAt ? null : new Date() }).where(eq(milestones.id, m.id));
}

// INT-01: approved external links (repository, notebook, drive) instead of importing account data.
export async function addLink(db: Db, actor: Actor, input: { enrollmentId: string; name: string; url: string }) {
  if ((await enrollmentAccess(db, actor, input.enrollmentId)) !== "student") throw new Forbidden();
  let url: URL;
  try { url = new URL(input.url.trim()); } catch { throw new UserError("That link isn't a valid URL."); }
  if (url.protocol !== "https:") throw new UserError("Links must start with https://");
  await db.insert(files).values({ enrollmentId: input.enrollmentId, uploaderId: actor.id, name: input.name.trim() || url.hostname, url: url.href });
}

export async function recordUpload(db: Db, actor: Actor, input: { enrollmentId: string; name: string; r2Key: string; size: number; contentType: string; sha256: string }) {
  if ((await enrollmentAccess(db, actor, input.enrollmentId)) !== "student") throw new Forbidden();
  const [f] = await db.insert(files).values({ ...input, uploaderId: actor.id }).returning();
  return f;
}

// AC-07: the form carries a clientKey, so a retried or double-clicked submit returns the same version.
export async function submit(db: Db, actor: Actor, input: {
  enrollmentId: string; clientKey: string; contributionStatement: string; reflection: string; fileIds: string[];
}) {
  if ((await enrollmentAccess(db, actor, input.enrollmentId)) !== "student") throw new Forbidden();
  const [existing] = await db.select().from(submissions).where(eq(submissions.clientKey, input.clientKey));
  if (existing) return existing.id;
  if (input.contributionStatement.trim().length < 20) throw new UserError("Describe what you did in at least a sentence or two.");
  if (!input.fileIds.length) throw new UserError("Attach at least one file or link as evidence.");
  return db.transaction(async (tx) => {
    const [e] = await tx.select().from(enrollments).where(eq(enrollments.id, input.enrollmentId)).for("update");
    if (!WORKING.includes(e.state)) throw new UserError("This project isn't waiting for a submission.");
    const own = await tx.select({ id: files.id }).from(files).where(eq(files.enrollmentId, e.id));
    if (input.fileIds.some((id) => !own.some((f) => f.id === id))) throw new Forbidden();
    const [{ v }] = await tx.select({ v: max(submissions.version) }).from(submissions).where(eq(submissions.enrollmentId, e.id));
    const [s] = await tx.insert(submissions).values({
      enrollmentId: e.id, version: (v ?? 0) + 1, fileIds: input.fileIds, clientKey: input.clientKey,
      contributionStatement: input.contributionStatement.trim().slice(0, 4000), reflection: input.reflection.trim().slice(0, 4000),
    }).returning();
    await tx.update(enrollments).set({ state: nextEnrollment(e.state, "submit"), updatedAt: new Date() }).where(eq(enrollments.id, e.id));
    return { s, e };
  }).then(async ({ s, e }) => {
    await track(db, "submission_created", e.id, actor.id, { version: s.version });
    if (e.mentorId) await notify(db, { userId: e.mentorId, kind: "review", essential: true, title: "A submission is waiting for your review",
      body: `Version ${s.version}. The target is feedback within five business days.`, href: `/mentor/review/${s.id}`, key: `submit:${e.id}:${s.id}` });
    return s.id;
  });
}

export async function fileForDownload(db: Db, actor: Actor, fileId: string) {
  const [f] = await db.select().from(files).where(eq(files.id, fileId));
  if (!f) throw new Forbidden(); // same answer as "no access", so ids can't be probed
  await enrollmentAccess(db, actor, f.enrollmentId);
  return f;
}
