import { desc, eq } from "drizzle-orm";
import { evaluate, nextEnrollment, type Score } from "@iq/core";
import { assessments, briefVersions, enrollments, submissions, type Db } from "@iq/db";
import type { Actor } from "./authz";
import { Forbidden, UserError } from "./errors";
import { audit, notify, track } from "./notify";
import { issueRewards } from "./rewards";

export type Decision = "accept" | "revise" | "not_complete";

// PRD §12, ASM-01..04. The assessor must be the enrollment's assigned mentor, and scores bind to the
// rubric version the student accepted (a later brief edit can't move the goalposts).
export async function assess(db: Db, actor: Actor, input: {
  submissionId: string; scores: Score[]; decision: Decision; comment: string; revisionDays?: number;
}) {
  const [row] = await db.select({ s: submissions, e: enrollments, v: briefVersions }).from(submissions)
    .innerJoin(enrollments, eq(enrollments.id, submissions.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .where(eq(submissions.id, input.submissionId));
  if (!row) throw new UserError("Submission not found.");
  if (row.e.mentorId !== actor.id) throw new Forbidden("Only the assigned mentor can assess this submission.");
  const [latest] = await db.select({ id: submissions.id }).from(submissions)
    .where(eq(submissions.enrollmentId, row.e.id)).orderBy(desc(submissions.version)).limit(1);
  if (latest.id !== row.s.id || row.e.state !== "submitted") throw new UserError("This submission isn't waiting for review.");

  const result = evaluate(row.v.content.rubric, input.scores);
  if (!result.valid) throw new UserError(result.errors.join(" "));
  if (input.decision === "accept" && !result.pass)
    throw new UserError(`Can't accept: ${result.failing.join(", ")} ${result.failing.length === 1 ? "is" : "are"} below the required threshold. Request a revision instead.`);
  if (input.decision !== "accept" && input.comment.trim().length < 20)
    throw new UserError("Say specifically what needs to change, so the student can act on it.");

  const action = { accept: "complete", revise: "requestRevision", not_complete: "closeIncomplete" } as const;
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.insert(assessments).values({
      submissionId: row.s.id, assessorId: actor.id, scores: input.scores, decision: input.decision, comment: input.comment.trim(),
      revisionDueAt: input.decision === "revise" ? new Date(now.getTime() + (input.revisionDays ?? 7) * 864e5) : null,
    });
    await tx.update(enrollments).set({
      state: nextEnrollment(row.e.state, action[input.decision]), updatedAt: now,
      ...(input.decision === "accept" && { completedAt: now, rewardsStatus: "pending" as const }),
    }).where(eq(enrollments.id, row.e.id));
  });
  await track(db, "review_decision", row.e.id, actor.id, { decision: input.decision, version: row.s.version });
  await audit(db, actor.id, `assessment_${input.decision}`, "submission", row.s.id);
  const title = { accept: "Your work was accepted", revise: "Your mentor asked for a revision", not_complete: "Your project was closed as not completed" }[input.decision];
  await notify(db, { userId: row.e.studentId, kind: "review", essential: true, title, body: input.decision === "not_complete" ? "You can appeal from the project workspace." : "",
    href: `/workspace/${row.e.id}?tab=submissions`, key: `assess:${row.e.id}:${row.s.id}` });
  // Separate from the acceptance on purpose (§13.3): a failure here leaves the work accepted and
  // rewards "pending", which the student's next page view retries.
  if (input.decision === "accept") await issueRewards(db, row.e.id).catch((err) => console.error("issueRewards failed", row.e.id, err));
}
