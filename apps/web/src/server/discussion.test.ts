import { eq, sql } from "drizzle-orm";
import { expect, test } from "vitest";
import { messages } from "@iq/db";
import { brief, confirmAndSubmit, db, makeOrg, makeUser } from "../../test/db";
import { apply, makeOffer, respondToOffer } from "./enrollments";
import { reviewProject, saveDraft } from "./projects";
import { addLink, postMessage } from "./workspace";

test("WRK-04: a question waits until someone else replies; attachments must belong to the project", async () => {
  const owner = await makeUser("owner"); const mentor = await makeUser("mentor"); const staff = await makeUser("staff", { isStaff: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id, capacity: 3 }) });
  await confirmAndSubmit(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const join = async (id: string) => {
    const s = await makeUser(id, { student: true });
    const e = await apply(db, s, { projectId, motivation: "I want to learn vibration analysis.", availability: "" });
    await makeOffer(db, owner, { enrollmentId: e });
    await respondToOffer(db, s, { enrollmentId: e, accept: true, agreed: true });
    return { s, e };
  };
  const a = await join("ada"); const b = await join("ben");
  await addLink(db, b.s, { enrollmentId: b.e, name: "Ben's notes", url: "https://example.org/b" });
  const [bf] = (await db.execute<{ id: string }>(sql`select id from files where enrollment_id = ${b.e}`)).rows;
  await expect(postMessage(db, a.s, { enrollmentId: a.e, body: "see this", fileId: bf.id })).rejects.toThrow("access");

  await postMessage(db, a.s, { enrollmentId: a.e, body: "Which window should I use?", isQuestion: true });
  await postMessage(db, a.s, { enrollmentId: a.e, body: "Also, the file has a gap on day 3." }); // own follow-up doesn't answer it
  let [q] = await db.select().from(messages).where(eq(messages.isQuestion, true));
  expect(q.answeredAt).toBeNull();
  await postMessage(db, mentor, { enrollmentId: a.e, body: "Hann is a good default." });
  [q] = await db.select().from(messages).where(eq(messages.isQuestion, true));
  expect(q.answeredAt).not.toBeNull();
});
