import { expect, test } from "vitest";
import { brief, db, makeOrg, makeSkill, makeUser } from "../../test/db";
import { listProjects, studentTiers } from "./discovery";
import { reviewProject, saveDraft, submitForReview } from "./projects";
import { removeSkillClaim, setSkillClaim, updateProfile } from "./profile";

test("self-reported skills never count as verified evidence or unlock a project", async () => {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  await makeSkill("sig");
  const id = await saveDraft(db, owner, { orgId: org.id, brief: brief({
    mentorId: mentor.id, prerequisites: [{ skillId: "sig", minTier: "emerging" }], skillIds: ["sig"],
    rubric: [{ id: "c1", name: "Sig", description: "", critical: true, threshold: 3, skillId: "sig" }],
  }) });
  await submitForReview(db, owner, id);
  await reviewProject(db, staff, { projectId: id, approve: true, note: "" });

  const ada = await makeUser("ada", { student: true });
  await setSkillClaim(db, ada, { skillId: "sig", level: "practical", note: "Two years in industry" });
  await setSkillClaim(db, ada, { skillId: "sig", level: "coursework", note: "" }); // update, not duplicate
  expect(await studentTiers(db, ada.id)).toEqual({});
  expect((await listProjects(db, ada, {})).cards[0].fit?.eligible).toBe(false);
  await expect(setSkillClaim(db, ada, { skillId: "nope", level: "learning", note: "" })).rejects.toThrow("Choose a skill");
  await expect(setSkillClaim(db, ada, { skillId: "sig", level: "expert", note: "" })).rejects.toThrow("Choose how");
  await removeSkillClaim(db, ada, "sig");
});

test("profile edits validate timezone and hours", async () => {
  const ada = await makeUser("ada", { student: true });
  await updateProfile(db, ada, { name: "Ada O.", pronouns: "she/her", discipline: "Mechanical engineering", bio: "", interests: "a, b,, c", goals: "", weeklyHours: 99, timezone: "Mars/Olympus" });
  const { studentProfiles } = await import("@iq/db");
  const [p] = await db.select().from(studentProfiles);
  expect(p).toMatchObject({ interests: ["a", "b", "c"], weeklyHours: 60, timezone: "UTC", pronouns: "she/her" });
  await expect(updateProfile(db, ada, { name: " ", pronouns: "", discipline: "", bio: "", interests: "", goals: "", weeklyHours: 1, timezone: "UTC" })).rejects.toThrow("name");
});
