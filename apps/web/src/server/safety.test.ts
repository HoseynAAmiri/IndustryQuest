import { eq } from "drizzle-orm";
import { expect, test } from "vitest";
import { enrollments, milestones, organizations, projects, user } from "@iq/db";
import { brief, confirmAndSubmit, db, makeOrg, makeUser } from "../../test/db";
import { blockContact, openCase, resolveCase } from "./cases";
import { apply, makeOffer, respondToOffer } from "./enrollments";
import { reviewProject, saveDraft } from "./projects";
import { setOrgSuspension } from "./staff";
import { addLink, postMessage } from "./workspace";

test("contact restrictions, pauses, suspension, feedback and deletion preserve related records", async () => {
  const owner = await makeUser("owner");
  const mentor = await makeUser("mentor");
  const staff = await makeUser("staff", { isStaff: true });
  const student = await makeUser("student", { student: true });
  const org = await makeOrg({ owner: owner.id, mentors: [mentor.id] });
  const projectId = await saveDraft(db, owner, { orgId: org.id, brief: brief({ mentorId: mentor.id }) });
  await confirmAndSubmit(db, owner, projectId);
  await reviewProject(db, staff, { projectId, approve: true, note: "" });
  const enrollmentId = await apply(db, student, { projectId, motivation: "I want to learn through this project.", availability: "" });
  await makeOffer(db, owner, { enrollmentId });
  await respondToOffer(db, student, { enrollmentId, accept: true, agreed: true });

  await db.update(enrollments).set({ state: "submitted" }).where(eq(enrollments.id, enrollmentId));
  expect((await openCase(db, mentor, { type: "reviewer_conflict", enrollmentId, summary: "I have a prior working relationship with this student." })).type).toBe("reviewer_conflict");
  await db.update(enrollments).set({ state: "active" }).where(eq(enrollments.id, enrollmentId));

  await blockContact(db, student, { enrollmentId, userId: mentor.id, reason: "I need staff to arrange a different contact." });
  await expect(postMessage(db, mentor, { enrollmentId, body: "Can you see this?" })).rejects.toThrow("restricted");

  const pause = await openCase(db, student, { type: "extension", enrollmentId, summary: "I need a short approved pause.", requestedDays: 4 });
  const [before] = await db.select().from(milestones).where(eq(milestones.enrollmentId, enrollmentId));
  await resolveCase(db, staff, { caseId: pause.id, resolution: "Approved for four days for the reason provided.", action: { kind: "pause", days: 4 } });
  const [paused] = await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId));
  const [after] = await db.select().from(milestones).where(eq(milestones.enrollmentId, enrollmentId));
  expect(paused.pausedUntil).not.toBeNull();
  expect(after.dueAt.getTime() - before.dueAt.getTime()).toBe(4 * 864e5);

  await setOrgSuspension(db, staff, { orgId: org.id, suspend: true, reason: "Quality review required before new activity." });
  expect((await db.select().from(projects).where(eq(projects.id, projectId)))[0].state).toBe("paused");
  expect((await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId)))[0].state).toBe("active");
  expect((await db.select().from(organizations).where(eq(organizations.id, org.id)))[0].suspensionReason).toContain("Quality review");

  await db.update(enrollments).set({ state: "completed", completedAt: new Date() }).where(eq(enrollments.id, enrollmentId));
  await expect(postMessage(db, student, { enrollmentId, body: "A late message" })).rejects.toThrow("read-only");
  await expect(addLink(db, student, { enrollmentId, name: "Late file", url: "https://example.org/late" })).rejects.toThrow("read-only");
  await openCase(db, student, { type: "mentor_feedback", enrollmentId, summary: "Clarity: 4/5\nResponsiveness: 4/5\nUseful and respectful." });
  await expect(openCase(db, student, { type: "mentor_feedback", enrollmentId, summary: "A duplicate feedback attempt." })).rejects.toThrow("already sent");

  const deletion = await openCase(db, student, { type: "deletion", summary: "Please delete and anonymize my account." });
  await resolveCase(db, staff, { caseId: deletion.id, resolution: "Identity removed and login revoked after confirming the request.", action: { kind: "delete_account" } });
  expect((await db.select().from(user).where(eq(user.id, student.id)))[0].name).toBe("Deleted user");
  expect(await db.select().from(enrollments).where(eq(enrollments.id, enrollmentId))).toHaveLength(1);
});
