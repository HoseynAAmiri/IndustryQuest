import { eq, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { cases, enrollments, milestones, xpTransactions } from "@iq/db";
import { brief, db, makeOrg, makeUser, confirmAndSubmit } from "../../test/db";
import { addCaseUpdate, openCase, resolveCase } from "./cases";
import { apply, makeOffer, respondToOffer } from "./enrollments";
import { reviewProject, saveDraft, submitForReview } from "./projects";
import { assess } from "./review";
import { addLink, submit } from "./workspace";

const rubric = [{ id: "c1", name: "Analysis", description: "", critical: true, threshold: 3 }];

async function active() {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor", { isStaff: true }); // a mentor who is also staff
  const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id, rubric, milestones: [{ title: "Draft", dueInDays: 7 }] }) });
  await confirmAndSubmit(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const ada = await makeUser("ada", { student: true });
  const e = await apply(db, ada, { projectId, motivation: "I want to learn vibration analysis.", availability: "" });
  await makeOffer(db, owner, { enrollmentId: e });
  await respondToOffer(db, ada, { enrollmentId: e, accept: true, agreed: true });
  return { owner, mentor, staff, org, ada, e };
}

test("AC-18: a report is private, changes nothing on the record, and staff resolve it with a reason", async () => {
  const w = await active();
  const c = await openCase(db, w.ada, { type: "conduct", enrollmentId: w.e, summary: "The company asked for work outside the agreed scope." });
  const other = await makeUser("other", { student: true });
  await expect(addCaseUpdate(db, other, { caseId: c.id, body: "hi" })).rejects.toThrow("don't have access");
  await expect(addCaseUpdate(db, w.owner, { caseId: c.id, body: "hi" })).rejects.toThrow("don't have access");
  expect((await db.select().from(enrollments).where(eq(enrollments.id, w.e)))[0].state).toBe("active");
  expect(await db.select().from(xpTransactions)).toHaveLength(0);
  await resolveCase(db, w.staff, { caseId: c.id, resolution: "Spoke with the company; scope is back to the brief.", action: { kind: "none" } });
  expect((await db.select().from(cases))[0]).toMatchObject({ status: "resolved", resolvedBy: w.staff.id });
});

test("an approved extension moves open milestones only", async () => {
  const w = await active();
  const [before] = await db.select().from(milestones).where(eq(milestones.enrollmentId, w.e));
  const c = await openCase(db, w.ada, { type: "extension", enrollmentId: w.e, summary: "The dataset arrived a week late.", requestedDays: 7 });
  await resolveCase(db, w.staff, { caseId: c.id, resolution: "Approved: the delay was on the company side.", action: { kind: "extend", days: 7 } });
  const [after] = await db.select().from(milestones).where(eq(milestones.enrollmentId, w.e));
  expect(after.dueAt.getTime() - before.dueAt.getTime()).toBe(7 * 864e5);
});

test("OPS-13: the assessor can't decide the appeal; another staff member reopens the work", async () => {
  const w = await active();
  await addLink(db, w.ada, { enrollmentId: w.e, name: "nb", url: "https://example.org/nb" });
  const [f] = (await db.execute<{ id: string }>(sql`select id from files`)).rows;
  const s = await submit(db, w.ada, { enrollmentId: w.e, clientKey: "k", contributionStatement: "I wrote the analysis notebook.", reflection: "", fileIds: [f.id] });
  await assess(db, w.mentor, { submissionId: s, scores: [{ criterionId: "c1", score: 1 }], decision: "not_complete", comment: "The analysis is missing entirely from the notebook." });
  await expect(openCase(db, w.owner, { type: "appeal", enrollmentId: w.e, summary: "Not mine to appeal" })).rejects.toThrow();
  const c = await openCase(db, w.ada, { type: "appeal", enrollmentId: w.e, summary: "The notebook had the analysis in a second tab the mentor missed." });
  await expect(resolveCase(db, w.mentor, { caseId: c.id, resolution: "Upheld after checking.", action: { kind: "none" } })).rejects.toThrow("took part");
  await resolveCase(db, w.staff, { caseId: c.id, resolution: "Appeal upheld: the analysis was there. Reopened for review.", action: { kind: "reopen" } });
  expect((await db.select().from(enrollments).where(eq(enrollments.id, w.e)))[0].state).toBe("revision_requested");
});
