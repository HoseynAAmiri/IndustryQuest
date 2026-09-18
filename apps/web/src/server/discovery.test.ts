import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { enrollments, projects, xpTransactions } from "@iq/db";
import { brief, db, makeOrg, makeSkill, makeUser } from "../../test/db";
import { listProjects, toggleSaved } from "./discovery";
import { reviewProject, saveDraft, submitForReview } from "./projects";

async function publish(orgId: string, owner: { id: string }, staff: { id: string }, b = brief()) {
  const id = await saveDraft(db, owner, { orgId, brief: b });
  await submitForReview(db, owner, id);
  await reviewProject(db, staff, { projectId: id, approve: true, note: "" });
  return id;
}

async function world() {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  await makeSkill("sig");
  return { owner, mentor, staff, org };
}

test("open places count active students and unexpired offers, not expired ones", async () => {
  const { owner, mentor, staff, org } = await world();
  const id = await publish(org.id, owner, staff, brief({ mentorId: mentor.id, capacity: 3 }));
  const [v] = await db.select({ v: projects.currentVersionId }).from(projects).where(eq(projects.id, id));
  for (const [sid, state, expires] of [["a", "active", null], ["b", "offered", 1], ["c", "offered", -1], ["d", "applied", null]] as const) {
    await makeUser(sid, { student: true });
    await db.insert(enrollments).values({
      projectId: id, studentId: sid, briefVersionId: v.v!, state, motivation: "x",
      offerExpiresAt: expires === null ? null : new Date(Date.now() + expires * 864e5),
    });
  }
  const { cards } = await listProjects(db, null, {});
  expect(cards[0].openPlaces).toBe(1); // 3 − active − live offer
});

test("paused and closed projects are hidden unless asked for; drafts never show", async () => {
  const { owner, mentor, staff, org } = await world();
  const live = await publish(org.id, owner, staff, brief({ mentorId: mentor.id, title: "Live one" }));
  const paused = await publish(org.id, owner, staff, brief({ mentorId: mentor.id, title: "Paused one" }));
  await db.update(projects).set({ state: "paused" }).where(eq(projects.id, paused));
  await saveDraft(db, owner, { orgId: org.id, brief: brief({ title: "Draft one" }) });
  expect((await listProjects(db, null, {})).cards.map((c) => c.id)).toEqual([live]);
  expect((await listProjects(db, null, { includeInactive: true })).cards.map((c) => c.b.title).sort()).toEqual(["Live one", "Paused one"]);
  expect((await listProjects(db, null, { q: "paus", includeInactive: true })).cards).toHaveLength(1);
});

test("AC-12: lots of XP but no skill evidence leaves a gated project locked", async () => {
  const { owner, mentor, staff, org } = await world();
  const student = await makeUser("ada", { student: true });
  await db.insert(xpTransactions).values({ userId: student.id, amount: 5000, kind: "issue", reason: "test", idempotencyKey: "k" });
  await publish(org.id, owner, staff, brief({
    mentorId: mentor.id, prerequisites: [{ skillId: "sig", minTier: "emerging" }],
    skillIds: ["sig"], rubric: [{ id: "c1", name: "Sig", description: "", critical: true, threshold: 3, skillId: "sig" }],
  }));
  const [card] = (await listProjects(db, student, {})).cards;
  expect(card.fit).toMatchObject({ eligible: false, score: -1 });
});

test("saving toggles and the saved filter follows it", async () => {
  const { owner, mentor, staff, org } = await world();
  const student = await makeUser("ada", { student: true });
  const id = await publish(org.id, owner, staff, brief({ mentorId: mentor.id }));
  expect(await toggleSaved(db, student, id)).toBe(true);
  expect((await listProjects(db, student, { saved: true })).cards).toHaveLength(1);
  expect(await toggleSaved(db, student, id)).toBe(false);
  expect((await listProjects(db, student, { saved: true })).cards).toHaveLength(0);
});
