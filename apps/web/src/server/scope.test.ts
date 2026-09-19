import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { briefVersions, enrollments, notifications, projects } from "@iq/db";
import { brief, confirmAndSubmit, db, makeOrg, makeUser } from "../../test/db";
import { apply, makeOffer, respondToOffer, respondToScopeChange } from "./enrollments";
import { confirmMentoring, reviewProject, reviseBrief, saveDraft, setListingState, submitForReview } from "./projects";

async function live() {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const b = brief({ mentorId: mentor.id, capacity: 3 });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: b });
  return { owner, mentor, staff, org, b, projectId };
}

test("MEN-02: a brief can't be submitted until its named mentor confirms", async () => {
  const w = await live();
  await expect(submitForReview(db, w.owner, w.projectId)).rejects.toThrow("mentor to confirm");
  await expect(confirmMentoring(db, w.owner, w.projectId)).rejects.toThrow("named mentor");
  await confirmMentoring(db, w.mentor, w.projectId);
  await submitForReview(db, w.owner, w.projectId);
});

test("AC-06: a material change needs the enrolled student's consent; the old agreement stays until then", async () => {
  const w = await live();
  await confirmAndSubmit(db, w.owner, w.projectId);
  await reviewProject(db, w.staff, { projectId: w.projectId, approve: true, note: "" });
  const ada = await makeUser("ada", { student: true });
  const e = await apply(db, ada, { projectId: w.projectId, motivation: "I want to learn vibration analysis.", availability: "" });
  await makeOffer(db, w.owner, { enrollmentId: e });
  await respondToOffer(db, ada, { enrollmentId: e, accept: true, agreed: true });
  const [{ briefVersionId: original }] = await db.select().from(enrollments).where(eq(enrollments.id, e));

  await expect(reviseBrief(db, w.owner, { projectId: w.projectId, brief: w.b, reason: "No real change here", material: true })).rejects.toThrow("Nothing");
  const v2 = await reviseBrief(db, w.owner, { projectId: w.projectId, brief: { ...w.b, deliverables: ["Notebook", "Memo"] }, reason: "The team also needs a one-page memo.", material: true });
  expect(v2).toBe(2);
  let [row] = await db.select().from(enrollments).where(eq(enrollments.id, e));
  expect(row.briefVersionId).toBe(original); // still bound to what was accepted
  expect(row.proposedVersionId).toBeTruthy();
  expect((await db.select().from(notifications).where(eq(notifications.userId, ada.id))).map((n) => n.kind)).toContain("scope");
  const [project] = await db.select().from(projects).where(eq(projects.id, w.projectId));
  expect(project.currentVersionId).toBe(row.proposedVersionId); // new applicants see v2

  await respondToScopeChange(db, ada, { enrollmentId: e, accept: false });
  [row] = await db.select().from(enrollments).where(eq(enrollments.id, e));
  expect([row.briefVersionId, row.proposedVersionId]).toEqual([original, null]);
  expect(await db.select().from(briefVersions).where(eq(briefVersions.id, original))).toHaveLength(1); // the old version is kept
});

test("PRJ-11: pausing needs a reason and tells applicants", async () => {
  const w = await live();
  await confirmAndSubmit(db, w.owner, w.projectId);
  await reviewProject(db, w.staff, { projectId: w.projectId, approve: true, note: "" });
  const ada = await makeUser("ada", { student: true });
  await apply(db, ada, { projectId: w.projectId, motivation: "I want to learn vibration analysis.", availability: "" });
  await expect(setListingState(db, w.owner, { projectId: w.projectId, action: "pause", reason: "" })).rejects.toThrow("reason");
  await setListingState(db, w.owner, { projectId: w.projectId, action: "pause", reason: "Data access is delayed by two weeks." });
  const [p] = await db.select().from(projects).where(eq(projects.id, w.projectId));
  expect([p.state, p.stateReason]).toEqual(["paused", "Data access is delayed by two weeks."]);
  expect((await db.select().from(notifications).where(eq(notifications.userId, ada.id))).map((n) => n.kind)).toContain("project");
  await setListingState(db, w.owner, { projectId: w.projectId, action: "resume", reason: "" });
});
