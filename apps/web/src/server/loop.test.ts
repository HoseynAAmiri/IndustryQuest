import { eq, sql } from "drizzle-orm";
import { expect, test, vi } from "vitest";
import { levelFromXp, type Score } from "@iq/core";
import { credentials, enrollments, milestones, skillEvidence, submissions, xpTransactions } from "@iq/db";
import { brief, db, makeOrg, makeSkill, makeUser } from "../../test/db";
import { apply, expireStaleOffers, makeOffer, reject, respondToOffer } from "./enrollments";
import { reviewProject, saveDraft, submitForReview } from "./projects";
import { assess } from "./review";
import * as rewards from "./rewards";
import { addLink, enrollmentAccess, fileForDownload, submit } from "./workspace";

const rubric = [
  { id: "c1", name: "Signal analysis", description: "", critical: true, threshold: 3, skillId: "sig" },
  { id: "c2", name: "Communication", description: "", critical: false, threshold: 3 },
];
const scores = (c1: number, c2 = 3): Score[] => [{ criterionId: "c1", score: c1 }, { criterionId: "c2", score: c2 }];

async function world(capacity = 2) {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  await makeSkill("sig");
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id, capacity, skillIds: ["sig"], rubric }) });
  await submitForReview(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const student = async (id: string) => {
    const s = await makeUser(id, { student: true });
    return { s, e: await apply(db, s, { projectId, motivation: "I want to learn vibration analysis properly.", availability: "6 h/week" }) };
  };
  return { owner, mentor, staff, org, projectId, student };
}

async function activeStudent() {
  const w = await world();
  const { s, e } = await w.student("ada");
  await makeOffer(db, w.owner, { enrollmentId: e });
  await respondToOffer(db, s, { enrollmentId: e, accept: true, agreed: true });
  await addLink(db, s, { enrollmentId: e, name: "Notebook", url: "https://example.com/nb" });
  const [f] = await db.execute<{ id: string }>(sql`select id from files where enrollment_id = ${e}`).then((r) => r.rows);
  const sub = (key: string) => submit(db, s, { enrollmentId: e, clientKey: key, contributionStatement: "I wrote the whole analysis notebook.", reflection: "", fileIds: [f.id] });
  return { ...w, s, e, fileId: f.id, sub };
}

test("AC-03: two offers racing for the last place, exactly one wins", async () => {
  const w = await world(1);
  const a = await w.student("a"); const b = await w.student("b");
  const results = await Promise.allSettled([
    makeOffer(db, w.owner, { enrollmentId: a.e }), makeOffer(db, w.owner, { enrollmentId: b.e }),
  ]);
  expect(results.filter((r) => r.status === "fulfilled")).toHaveLength(1);
  expect(results.find((r) => r.status === "rejected")).toMatchObject({ reason: { message: expect.stringContaining("No places left") } });
});

test("AC-04: an expired offer releases its place once, and the company can offer it again", async () => {
  const w = await world(1);
  const a = await w.student("a"); const b = await w.student("b");
  await makeOffer(db, w.owner, { enrollmentId: a.e });
  await expect(makeOffer(db, w.owner, { enrollmentId: b.e })).rejects.toThrow("No places left");
  await db.update(enrollments).set({ offerExpiresAt: new Date(Date.now() - 1000) }).where(eq(enrollments.id, a.e));
  await expireStaleOffers(db);
  await expireStaleOffers(db);
  await expect(respondToOffer(db, a.s, { enrollmentId: a.e, accept: true, agreed: true })).rejects.toThrow();
  await makeOffer(db, w.owner, { enrollmentId: b.e });
  const [row] = await db.select().from(enrollments).where(eq(enrollments.id, a.e));
  expect(row.state).toBe("offer_expired");
});

test("AC-05 and ENR-12: acceptance records version and mentor; a rejection costs no XP", async () => {
  const w = await world();
  const a = await w.student("a"); const b = await w.student("b");
  await reject(db, w.owner, { enrollmentId: b.e, note: "Places went to earlier applicants." });
  await makeOffer(db, w.owner, { enrollmentId: a.e });
  await expect(respondToOffer(db, a.s, { enrollmentId: a.e, accept: true })).rejects.toThrow("Confirm");
  await respondToOffer(db, a.s, { enrollmentId: a.e, accept: true, agreed: true });
  const [row] = await db.select().from(enrollments).where(eq(enrollments.id, a.e));
  expect(row).toMatchObject({ state: "active", mentorId: w.mentor.id });
  expect(row.briefVersionId).toBeTruthy();
  expect(await db.select().from(milestones).where(eq(milestones.enrollmentId, a.e))).toHaveLength(1);
  expect(await db.select().from(xpTransactions)).toHaveLength(0);
});

test("AC-07: a retried submit with the same key creates one submission", async () => {
  const w = await activeStudent();
  const [x, y] = await Promise.all([w.sub("key-1"), w.sub("key-1")].map((p) => p.catch(() => "dup")));
  const rows = await db.select().from(submissions).where(eq(submissions.enrollmentId, w.e));
  expect(rows).toHaveLength(1);
  expect([x, y]).toContain(rows[0].id);
});

test("AC-08: unrelated students, other orgs and unassigned mentors can't reach the work", async () => {
  const w = await activeStudent();
  const stranger = await makeUser("stranger", { student: true });
  const otherOwner = await makeUser("other-owner"); const otherMentor = await makeUser("other-mentor");
  await makeOrg({ owner: otherOwner.id, mentors: [otherMentor.id] });
  for (const u of [stranger, otherOwner, otherMentor])
    await expect(fileForDownload(db, u, w.fileId)).rejects.toThrow("don't have access");
  expect(await enrollmentAccess(db, w.owner, w.e)).toBe("owner");
  expect(await enrollmentAccess(db, w.mentor, w.e)).toBe("mentor");
  await db.update(enrollments).set({ mentorId: null }).where(eq(enrollments.id, w.e)); // mentor replaced
  await expect(enrollmentAccess(db, w.mentor, w.e)).rejects.toThrow("don't have access");
});

test("AC-09 → AC-11: revision keeps history, acceptance gives 120 XP, First Quest and Emerging", async () => {
  const w = await activeStudent();
  const first = await w.sub("v1");
  await expect(assess(db, w.mentor, { submissionId: first, scores: scores(2, 4), decision: "accept", comment: "" })).rejects.toThrow("below the required threshold");
  await assess(db, w.mentor, { submissionId: first, scores: scores(2), decision: "revise", comment: "Window the signal before the FFT and label the axes." });
  const second = await w.sub("v2");
  await assess(db, w.mentor, { submissionId: second, scores: scores(3), decision: "accept", comment: "Clear, correct analysis." });

  expect(await db.select().from(submissions).where(eq(submissions.enrollmentId, w.e))).toHaveLength(2);
  const xp = await db.select().from(xpTransactions).where(eq(xpTransactions.userId, w.s.id));
  expect(xp.map((x) => x.amount)).toEqual([120]);
  expect(levelFromXp(120)).toBe(1);
  const creds = await db.select().from(credentials).where(eq(credentials.userId, w.s.id));
  expect(creds.map((c) => c.title).sort()).toEqual(["Emerging: sig", "First Quest", "Verified completion: Vibration spectrum"]);
});

test("AC-10: processing the same completion twice issues once", async () => {
  const w = await activeStudent();
  const sub = await w.sub("v1");
  await assess(db, w.mentor, { submissionId: sub, scores: scores(3), decision: "accept", comment: "Good." });
  await db.update(enrollments).set({ rewardsStatus: "pending" }).where(eq(enrollments.id, w.e)); // pretend we don't know
  await Promise.all([rewards.issueRewards(db, w.e), rewards.issueRewards(db, w.e)]);
  expect(await db.select().from(xpTransactions)).toHaveLength(1);
  expect(await db.select().from(credentials)).toHaveLength(3);
  expect(await db.select().from(skillEvidence)).toHaveLength(1);
});

test("AC-17: if issuance fails, the work stays accepted and a retry issues once", async () => {
  const w = await activeStudent();
  const sub = await w.sub("v1");
  const spy = vi.spyOn(console, "error").mockImplementation(() => {});
  await db.execute(sql`alter table xp_transactions add constraint fail_once check (amount < 0) not valid`);
  await assess(db, w.mentor, { submissionId: sub, scores: scores(3), decision: "accept", comment: "Good." });
  await db.execute(sql`alter table xp_transactions drop constraint fail_once`);
  spy.mockRestore();
  let [row] = await db.select().from(enrollments).where(eq(enrollments.id, w.e));
  expect(row).toMatchObject({ state: "completed", rewardsStatus: "pending" });
  await rewards.issuePendingFor(db, w.s.id);
  await rewards.issuePendingFor(db, w.s.id);
  [row] = await db.select().from(enrollments).where(eq(enrollments.id, w.e));
  expect(row.rewardsStatus).toBe("issued");
  expect(await db.select().from(xpTransactions)).toHaveLength(1);
});
