import { and, eq, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { auditEvents, credentials, enrollments, notifications, organizations, skillEvidence, xpTransactions } from "@iq/db";
import { brief, confirmAndSubmit, db, makeOrg, makeSkill, makeUser } from "../../test/db";
import { eligibilityTiers, listProjects, studentTiers } from "./discovery";
import { apply, makeOffer, respondToOffer } from "./enrollments";
import { reviewProject, saveDraft } from "./projects";
import { assess } from "./review";
import { grantEquivalency, grantException, revokeCredential, runEscalations, undoOrgVerification, verifyOrgWithNote } from "./staff";
import { addLink, submit } from "./workspace";

const rubric = [{ id: "c1", name: "Sig", description: "", critical: true, threshold: 3, skillId: "sig" }];

async function world() {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  await makeSkill("sig");
  const publish = async (b = {}) => {
    const id = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id, capacity: 5, skillIds: ["sig"], rubric, ...b }) });
    await confirmAndSubmit(db, owner, id);
    await reviewProject(db, staff, { projectId: id, approve: true, note: "" });
    return id;
  };
  const join = async (s: { id: string }, projectId: string) => {
    const e = await apply(db, s, { projectId, motivation: "I want to learn vibration analysis.", availability: "" });
    await makeOffer(db, owner, { enrollmentId: e });
    await respondToOffer(db, s, { enrollmentId: e, accept: true, agreed: true });
    return e;
  };
  const finish = async (s: { id: string }, e: string, score = 3) => {
    await addLink(db, s, { enrollmentId: e, name: "nb", url: "https://example.org/nb" });
    const [f] = (await db.execute<{ id: string }>(sql`select id from files where enrollment_id = ${e}`)).rows;
    const sub = await submit(db, s, { enrollmentId: e, clientKey: `k-${e}`, contributionStatement: "I wrote the analysis notebook.", reflection: "", fileIds: [f.id] });
    await assess(db, mentor, { submissionId: sub, scores: [{ criterionId: "c1", score }], decision: "accept", comment: "Good." });
    return sub;
  };
  return { owner, mentor, staff, org, publish, join, finish };
}

test("AC-15: revoking a completion reverses XP, retires evidence and drops tiers that no longer hold", async () => {
  const w = await world();
  const ada = await makeUser("ada", { student: true });
  const e = await w.join(ada, await w.publish());
  await w.finish(ada, e);
  expect(await studentTiers(db, ada.id)).toEqual({ sig: "emerging" });
  const [completion] = await db.select().from(credentials).where(and(eq(credentials.userId, ada.id), eq(credentials.kind, "completion")));
  await expect(revokeCredential(db, ada, { credentialId: completion.id, reason: "Plagiarism confirmed after review." })).rejects.toThrow("access");
  await revokeCredential(db, w.staff, { credentialId: completion.id, reason: "Plagiarism confirmed after review." });
  const xp = await db.select().from(xpTransactions).where(eq(xpTransactions.userId, ada.id));
  expect(xp.map((x) => [x.kind, x.amount]).sort()).toEqual([["correction", -120], ["issue", 120]]);
  expect(await studentTiers(db, ada.id)).toEqual({});
  const statuses = (await db.select().from(credentials).where(eq(credentials.userId, ada.id))).map((c) => c.status);
  expect(statuses).toEqual(["revoked", "revoked", "revoked"]);
  expect((await db.select().from(skillEvidence))[0].revokedAt).not.toBeNull(); // kept, not deleted
  expect((await db.select().from(notifications).where(eq(notifications.userId, ada.id))).map((n) => n.title)).toContainEqual(expect.stringContaining("revoked"));
});

test("organization verification is atomic, attributable and only its exact action can be undone", async () => {
  const staff = await makeUser("staff", { isStaff: true });
  const owner = await makeUser("owner");
  const org = await makeOrg({ owner: owner.id, verified: false });
  const result = await verifyOrgWithNote(db, staff, { orgId: org.id, note: "Register and work email checked." });
  let [saved] = await db.select().from(organizations).where(eq(organizations.id, org.id));
  expect([saved.verifiedBy, saved.verificationNote]).toEqual([staff.id, "Register and work email checked."]);
  expect((await db.select().from(auditEvents).where(eq(auditEvents.id, result.eventId)))[0].targetId).toBe(org.id);
  await expect(verifyOrgWithNote(db, staff, { orgId: org.id, note: "Checked again." })).rejects.toThrow("already verified");
  await undoOrgVerification(db, staff, result);
  [saved] = await db.select().from(organizations).where(eq(organizations.id, org.id));
  expect([saved.verifiedAt, saved.verifiedBy, saved.verificationNote]).toEqual([null, null, null]);
  await expect(undoOrgVerification(db, staff, result)).rejects.toThrow("not undone");
});

test("AC-22: an equivalency unlocks a gated project without issuing any credential", async () => {
  const w = await world();
  const gated = await w.publish({ prerequisites: [{ skillId: "sig", minTier: "emerging" }] });
  const dev = await makeUser("dev", { student: true });
  expect((await listProjects(db, dev, {})).cards.find((c) => c.id === gated)?.fit?.eligible).toBe(false);
  await grantEquivalency(db, w.staff, { userId: dev.id, skillId: "sig", evidence: "Two years as a vibration technician; reference checked." });
  expect(await eligibilityTiers(db, dev.id)).toEqual({ sig: "emerging" });
  expect(await studentTiers(db, dev.id)).toEqual({}); // not a platform tier
  expect(await db.select().from(credentials).where(eq(credentials.userId, dev.id))).toHaveLength(0);
  await apply(db, dev, { projectId: gated, motivation: "I've done this work before and want verified evidence.", availability: "" });
});

test("ENR-07: a staff exception raises the active-project limit", async () => {
  const w = await world();
  const ada = await makeUser("ada", { student: true });
  for (let i = 0; i < 2; i++) await w.join(ada, await w.publish({ title: `Project ${i}` }));
  const third = await w.publish({ title: "Project 3" });
  await expect(w.join(ada, third)).rejects.toThrow("active projects");
  await grantException(db, w.staff, { userId: ada.id, slots: 1, reason: "Two of these are short, and her course coordinator agreed." });
  const e3 = (await db.select().from(enrollments).where(and(eq(enrollments.studentId, ada.id), eq(enrollments.projectId, third))))[0].id;
  await respondToOffer(db, ada, { enrollmentId: e3, accept: true, agreed: true });
});

test("AC-13: a late review escalates to mentor and staff once, with no penalty for the student", async () => {
  const w = await world();
  const ada = await makeUser("ada", { student: true });
  const e = await w.join(ada, await w.publish());
  await addLink(db, ada, { enrollmentId: e, name: "nb", url: "https://example.org/nb" });
  const [f] = (await db.execute<{ id: string }>(sql`select id from files where enrollment_id = ${e}`)).rows;
  await submit(db, ada, { enrollmentId: e, clientKey: "k", contributionStatement: "I wrote the analysis notebook.", reflection: "", fileIds: [f.id] });
  await db.execute(sql`update submissions set created_at = now() - interval '10 days'`);
  await runEscalations(db);
  await runEscalations(db);
  const kinds = async (id: string) => (await db.select().from(notifications).where(eq(notifications.userId, id))).map((n) => n.title);
  expect((await kinds(w.mentor.id)).filter((t) => t.startsWith("Review past"))).toHaveLength(1);
  expect((await kinds(w.staff.id)).filter((t) => t.startsWith("Escalation"))).toHaveLength(1);
  expect((await db.select().from(enrollments).where(eq(enrollments.id, e)))[0].state).toBe("submitted");
  expect(await db.select().from(xpTransactions)).toHaveLength(0);
});
