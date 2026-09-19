import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { events, notifications } from "@iq/db";
import { brief, db, makeOrg, makeUser, confirmAndSubmit } from "../../test/db";
import { apply, makeOffer } from "./enrollments";
import { notify } from "./notify";
import { reviewProject, saveDraft, submitForReview } from "./projects";

test("NTF-05: the same event key notifies once", async () => {
  const u = await makeUser("u");
  await notify(db, { userId: u.id, kind: "x", title: "Hi", href: "/", key: "k1" });
  await notify(db, { userId: u.id, kind: "x", title: "Hi again", href: "/", key: "k1" });
  expect(await db.select().from(notifications)).toHaveLength(1);
});

test("applying tells the owner, an offer tells the student, analytics keep ids only", async () => {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id }) });
  await confirmAndSubmit(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const ada = await makeUser("ada", { student: true });
  const motivation = "I want to learn vibration analysis on real data.";
  const e = await apply(db, ada, { projectId, motivation, availability: "" });
  await makeOffer(db, owner, { enrollmentId: e });
  const byUser = async (id: string) => (await db.select().from(notifications).where(eq(notifications.userId, id))).map((n) => n.kind);
  expect(await byUser(owner.id)).toContain("application");
  expect(await byUser(ada.id)).toEqual(["offer"]);
  expect(await byUser(staff.id)).toEqual(["staff"]);
  const ev = await db.select().from(events);
  expect(ev.map((x) => x.name)).toEqual(["application_submitted", "offer_created"]);
  expect(JSON.stringify(ev)).not.toContain(motivation);
});
