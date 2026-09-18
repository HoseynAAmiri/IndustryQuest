import { expect, test } from "vitest";
import { brief, db, makeOrg, makeUser } from "../../test/db";
import { loadProject, reviewProject, saveDraft, submitForReview } from "./projects";

async function setup(verified = true) {
  const owner = await makeUser("owner");
  const mentor = await makeUser("mentor");
  const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id], verified });
  return { owner, mentor, staff, org };
}

test("AC-02: submitting without mentor, rubric or compensation is blocked with specific reasons", async () => {
  const { owner, org } = await setup();
  const id = await saveDraft(db, owner, { orgId: org.id, brief: brief({ compensation: "", rubric: [] }) });
  const err = await submitForReview(db, owner, id).catch((e) => e.message);
  expect(err).toContain("Name a mentor");
  expect(err).toContain("State the compensation terms");
  expect(err).toContain("Publish an assessment rubric");
  expect((await loadProject(db, id)).project.state).toBe("draft");
});

test("a complete brief goes draft → in review → changes requested → published", async () => {
  const { owner, mentor, staff, org } = await setup();
  const id = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id }) });
  await submitForReview(db, owner, id);
  await expect(reviewProject(db, staff, { projectId: id, approve: false, note: "" })).rejects.toThrow("Say what needs to change");
  await reviewProject(db, staff, { projectId: id, approve: false, note: "Shrink the scope." });
  expect((await loadProject(db, id)).project).toMatchObject({ state: "changes_requested", reviewNote: "Shrink the scope." });
  await saveDraft(db, owner, { projectId: id, orgId: org.id, brief: brief({ mentorId: mentor.id, title: "Smaller scope" }) });
  await submitForReview(db, owner, id);
  await reviewProject(db, staff, { projectId: id, approve: true, note: "" });
  const { project, brief: v } = await loadProject(db, id);
  expect([project.state, v.title, v.xp]).toEqual(["published", "Smaller scope", 120]);
  await expect(saveDraft(db, owner, { projectId: id, orgId: org.id, brief: brief() })).rejects.toThrow("can't be edited");
});

test("only owners edit, only staff approve, mentors must belong to the org, unverified orgs can't publish", async () => {
  const { owner, mentor, staff, org } = await setup(false);
  const stranger = await makeUser("stranger");
  await expect(saveDraft(db, stranger, { orgId: org.id, brief: brief() })).rejects.toThrow("don't have access");
  await expect(saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: stranger.id }) })).rejects.toThrow("mentor must be");
  const id = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id }) });
  await expect(submitForReview(db, owner, id)).rejects.toThrow("not been verified");
  await expect(reviewProject(db, owner, { projectId: id, approve: true, note: "" })).rejects.toThrow("don't have access");
  await expect(reviewProject(db, staff, { projectId: id, approve: true, note: "" })).rejects.toThrow(); // still a draft
});
