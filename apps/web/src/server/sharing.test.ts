import { eq, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { cases, credentials, memberships, projects, studentProfiles } from "@iq/db";
import { brief, confirmAndSubmit, db, makeOrg, makeUser } from "../../test/db";
import { addMember, registerCompany, removeMember } from "./company";
import { proposeSummary, publicCredential, reviewSummary, setCredentialPublic } from "./credentials";
import { apply, makeOffer, respondToOffer } from "./enrollments";
import { setVisibility, sharedProfile } from "./profile";
import { reviewProject, saveDraft } from "./projects";
import { assess } from "./review";
import { addLink, submit } from "./workspace";

async function completed() {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id }) });
  await confirmAndSubmit(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const ada = await makeUser("ada", { student: true });
  const e = await apply(db, ada, { projectId, motivation: "I want to learn vibration analysis.", availability: "" });
  await makeOffer(db, owner, { enrollmentId: e });
  await respondToOffer(db, ada, { enrollmentId: e, accept: true, agreed: true });
  await addLink(db, ada, { enrollmentId: e, name: "nb", url: "https://example.org/nb" });
  const [f] = (await db.execute<{ id: string }>(sql`select id from files`)).rows;
  const s = await submit(db, ada, { enrollmentId: e, clientKey: "k", contributionStatement: "I wrote the notebook.", reflection: "private thoughts", fileIds: [f.id] });
  await assess(db, mentor, { submissionId: s, scores: [{ criterionId: "c1", score: 3 }], decision: "accept", comment: "Good." });
  const [completion] = (await db.select().from(credentials).where(eq(credentials.userId, ada.id))).filter((c) => c.kind === "completion");
  return { owner, ada, org, completion };
}

test("AC-19: a new link or going private stops the old link at once, and nothing private leaks", async () => {
  const w = await completed();
  expect(await sharedProfile(db, "anything")).toBeNull();
  await setVisibility(db, w.ada, { visibility: "link" });
  const [{ shareToken: first }] = await db.select().from(studentProfiles);
  const shared = await sharedProfile(db, first!);
  expect(shared?.name).toBe("ada");
  expect(JSON.stringify(shared)).not.toContain("ada@test.local");
  expect(JSON.stringify(shared)).not.toContain("private thoughts");
  await setVisibility(db, w.ada, { visibility: "link", newLink: true });
  expect(await sharedProfile(db, first!)).toBeNull();
  const [{ shareToken: second }] = await db.select().from(studentProfiles);
  await setVisibility(db, w.ada, { visibility: "private" });
  expect(await sharedProfile(db, second!)).toBeNull();
});

test("CRD-06 and CRD-03: expiring links, and summaries shown only after company approval", async () => {
  const w = await completed();
  await setCredentialPublic(db, w.ada, { credentialId: w.completion.id, isPublic: true, days: 30 });
  expect(await publicCredential(db, w.completion.id, null)).not.toBeNull();
  await db.update(credentials).set({ publicUntil: new Date(Date.now() - 1000) }).where(eq(credentials.id, w.completion.id));
  expect(await publicCredential(db, w.completion.id, null)).toBeNull();
  expect(await publicCredential(db, w.completion.id, w.ada)).not.toBeNull(); // the owner still sees a preview

  await proposeSummary(db, w.ada, { credentialId: w.completion.id, summary: "I built the vibration spectrum analysis and explained the bearing-wear peaks." });
  const stranger = await makeUser("stranger");
  await expect(reviewSummary(db, stranger, { credentialId: w.completion.id, approve: true, note: "" })).rejects.toThrow("access");
  await reviewSummary(db, w.owner, { credentialId: w.completion.id, approve: true, note: "" });
  expect((await db.select().from(credentials).where(eq(credentials.id, w.completion.id)))[0].summaryStatus).toBe("approved");
});

test("ORG-02/06: company intake creates an unverified org, a draft and a staff case; team rules hold", async () => {
  const kim = await makeUser("kim");
  const orgId = await registerCompany(db, kim, { name: "Acme", description: "", challenge: "Our maintenance logs are a mess and we'd like a student to help." });
  expect(await db.select().from(projects).where(eq(projects.orgId, orgId))).toHaveLength(1);
  expect((await db.select().from(cases))[0].summary).toContain("Project intake");
  await expect(removeMember(db, kim, { orgId, userId: kim.id, role: "owner" })).rejects.toThrow("at least one owner");
  await expect(addMember(db, kim, { orgId, email: "nobody@test.local", role: "mentor" })).rejects.toThrow("No account");
  await makeUser("lee");
  await addMember(db, kim, { orgId, email: "lee@test.local", role: "mentor" });
  expect(await db.select().from(memberships).where(eq(memberships.orgId, orgId))).toHaveLength(2);
});
