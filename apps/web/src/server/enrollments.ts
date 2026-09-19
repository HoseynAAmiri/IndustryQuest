import { and, eq, inArray, lt, sql } from "drizzle-orm";
import { SEAT_STATES, checkEligibility, nextEnrollment } from "@iq/core";
import { briefVersions, enrollments, milestones, projects, studentProfiles, type Db } from "@iq/db";
import { assertOrgRole, type Actor } from "./authz";
import { seatsTaken, studentTiers } from "./discovery";
import { Forbidden, UserError } from "./errors";
import { audit, notify, notifyAll, ownersOf, track } from "./notify";

const OFFER_DAYS = 5;
const ACTIVE_LIMIT = 2; // ENR-07: concurrent projects per student

// Offers expire by time, not by a job: flip any stale ones before reading (PRD §13.2, AC-04).
export async function expireStaleOffers(db: Db) {
  const expired = await db.update(enrollments).set({ state: "offer_expired", updatedAt: new Date() })
    .where(and(eq(enrollments.state, "offered"), lt(enrollments.offerExpiresAt, sql`now()`))).returning();
  for (const e of expired) {
    await track(db, "offer_expired", e.id, null);
    await notify(db, { userId: e.studentId, kind: "offer", title: "An offer expired", body: "The place went back to the company. You can apply to other projects.", href: "/quests", key: `offer-expired:${e.id}` });
  }
}

async function load(db: Db, enrollmentId: string) {
  const [row] = await db.select({ e: enrollments, p: projects, v: briefVersions }).from(enrollments)
    .innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .where(eq(enrollments.id, enrollmentId));
  if (!row) throw new UserError("Application not found.");
  return row;
}

export async function apply(db: Db, actor: Actor, input: { projectId: string; motivation: string; availability: string }) {
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, actor.id));
  if (!profile) throw new UserError("Finish your student profile before applying.");
  const [row] = await db.select({ p: projects, v: briefVersions }).from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId)).where(eq(projects.id, input.projectId));
  if (!row || row.p.state !== "published") throw new UserError("This project isn't taking applications.");
  if (row.v.content.applyDeadline < new Date().toISOString().slice(0, 10)) throw new UserError("The application deadline has passed.");
  const { eligible } = checkEligibility(row.v.content.prerequisites, await studentTiers(db, actor.id));
  if (!eligible) throw new UserError("You don't have the required skill evidence for this project yet.");
  const motivation = input.motivation.trim();
  if (motivation.length < 20) throw new UserError("Tell the company a little more about why you want this project (20 characters or more).");
  const [e] = await db.insert(enrollments).values({
    projectId: row.p.id, studentId: actor.id, briefVersionId: row.v.id, motivation: motivation.slice(0, 2000),
    availability: input.availability.trim().slice(0, 500),
  }).onConflictDoNothing().returning();
  if (!e) throw new UserError("You already have an open application for this project.");
  await track(db, "application_submitted", e.id, actor.id, { tier: row.v.tier });
  await notifyAll(db, await ownersOf(db, row.p.orgId), {
    kind: "application", title: `New application: ${row.v.title}`, body: "A student applied. Review it against your published criteria.",
    href: `/company/projects/${row.p.id}#applicants`, key: `apply:${e.id}`,
  });
  return e.id;
}

export async function withdraw(db: Db, actor: Actor, enrollmentId: string) {
  const { e } = await load(db, enrollmentId);
  if (e.studentId !== actor.id) throw new Forbidden();
  await db.update(enrollments).set({ state: nextEnrollment(e.state, "withdraw"), updatedAt: new Date() }).where(eq(enrollments.id, e.id));
  await track(db, "enrollment_withdrawn", e.id, actor.id, { from: e.state });
}

export async function reject(db: Db, actor: Actor, input: { enrollmentId: string; note: string }) {
  const { e, p } = await load(db, input.enrollmentId);
  await assertOrgRole(db, actor, p.orgId, "owner");
  await db.update(enrollments).set({ state: nextEnrollment(e.state, "reject"), decisionNote: input.note.trim() || null, updatedAt: new Date() })
    .where(eq(enrollments.id, e.id));
  await track(db, "application_declined", e.id, actor.id);
  await notify(db, { userId: e.studentId, kind: "decision", essential: true, title: "Decision on your application",
    body: `${input.note.trim() || "The company chose other applicants this time."} Nothing negative goes on your profile.`, href: "/quests", key: `reject:${e.id}` });
}

// AC-03: lock the project row so concurrent offers queue up; at most one can take the last place.
export async function makeOffer(db: Db, actor: Actor, input: { enrollmentId: string; days?: number }) {
  const { e, p, v } = await load(db, input.enrollmentId);
  await assertOrgRole(db, actor, p.orgId, "owner");
  if (p.state !== "published") throw new UserError("Publish or reopen the project before making offers.");
  if (!v.mentorId) throw new UserError("Assign a mentor before making offers.");
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${projects} where id = ${p.id} for update`);
    const taken = (await seatsTaken(tx, [p.id])).get(p.id) ?? 0;
    if (taken >= v.capacity) throw new UserError("No places left. Every place is taken or held by an open offer.");
    const [cur] = await tx.select({ state: enrollments.state }).from(enrollments).where(eq(enrollments.id, e.id));
    await tx.update(enrollments).set({
      state: nextEnrollment(cur.state, "offer"), updatedAt: new Date(),
      offerExpiresAt: new Date(Date.now() + (input.days ?? OFFER_DAYS) * 864e5),
    }).where(eq(enrollments.id, e.id));
  });
  await track(db, "offer_created", e.id, actor.id, { days: input.days ?? OFFER_DAYS });
  await notify(db, { userId: e.studentId, kind: "offer", essential: true, title: `You have an offer: ${v.title}`,
    body: `Reply within ${input.days ?? OFFER_DAYS} days. After that the place goes back to the company.`, href: "/quests", key: `offer:${e.id}` });
}

// AC-05: accepting binds the student to the exact brief version, rubric, reward rule and mentor
// already stored on the enrollment. Milestone dates start now.
export async function respondToOffer(db: Db, actor: Actor, input: { enrollmentId: string; accept: boolean; agreed?: boolean }) {
  const { e, p, v } = await load(db, input.enrollmentId);
  if (e.studentId !== actor.id) throw new Forbidden();
  if (e.state === "offered" && e.offerExpiresAt! < new Date()) {
    await db.update(enrollments).set({ state: nextEnrollment(e.state, "expireOffer"), updatedAt: new Date() }).where(eq(enrollments.id, e.id));
    throw new UserError("This offer expired, so the place went back to the company.");
  }
  if (!input.accept) {
    await db.update(enrollments).set({ state: nextEnrollment(e.state, "declineOffer"), updatedAt: new Date() }).where(eq(enrollments.id, e.id));
    await track(db, "offer_declined", e.id, actor.id);
    await notifyAll(db, await ownersOf(db, p.orgId), { kind: "offer", title: `Offer declined: ${v.title}`, body: "The place is free to offer again.", href: `/company/projects/${p.id}#applicants`, key: `decline:${e.id}` });
    return;
  }
  if (!input.agreed) throw new UserError("Confirm that you've read the brief, rubric and terms.");
  await db.transaction(async (tx) => {
    await tx.execute(sql`select id from ${projects} where id = ${e.projectId} for update`);
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(enrollments)
      .where(and(eq(enrollments.studentId, actor.id), inArray(enrollments.state, [...SEAT_STATES])));
    if (n >= ACTIVE_LIMIT) throw new UserError(`You already have ${n} active projects. Finish or withdraw from one first, or ask staff for an exception.`);
    const now = new Date();
    await tx.update(enrollments).set({ state: nextEnrollment(e.state, "acceptOffer"), acceptedAt: now, mentorId: v.mentorId, updatedAt: now })
      .where(eq(enrollments.id, e.id));
    if (v.content.milestones.length)
      await tx.insert(milestones).values(v.content.milestones.map((m) => ({
        enrollmentId: e.id, title: m.title, dueAt: new Date(now.getTime() + m.dueInDays * 864e5),
      })));
  });
  await track(db, "offer_accepted", e.id, actor.id, { briefVersion: v.version });
  await notifyAll(db, [...await ownersOf(db, p.orgId), ...(v.mentorId ? [v.mentorId] : [])], {
    kind: "enrollment", essential: true, title: `Enrollment confirmed: ${v.title}`,
    body: "The student accepted the offer and the agreed brief version. Milestone dates start today.", href: `/workspace/${e.id}`, key: `accept:${e.id}`,
  });
}

// AC-06: the student decides. Accepting moves them to the new version; declining keeps the old agreement.
export async function respondToScopeChange(db: Db, actor: Actor, input: { enrollmentId: string; accept: boolean }) {
  const { e, p, v } = await load(db, input.enrollmentId);
  if (e.studentId !== actor.id) throw new Forbidden();
  if (!e.proposedVersionId) throw new UserError("There's no pending change.");
  await db.update(enrollments).set({
    ...(input.accept && { briefVersionId: e.proposedVersionId }), proposedVersionId: null, proposalReason: null, updatedAt: new Date(),
  }).where(eq(enrollments.id, e.id));
  await audit(db, actor.id, input.accept ? "scope_change_accepted" : "scope_change_declined", "enrollment", e.id, undefined, { from: e.briefVersionId, to: e.proposedVersionId });
  await notifyAll(db, await ownersOf(db, p.orgId), {
    kind: "scope", essential: true, title: `${input.accept ? "Change accepted" : "Change declined"}: ${v.title}`,
    body: input.accept ? "The student moved to the new brief version." : "The student keeps the original agreement. Talk to staff if the project can't continue as agreed.",
    href: `/workspace/${e.id}`, key: `scope-reply:${e.id}:${e.proposedVersionId}`,
  });
}
