import { and, desc, eq, inArray } from "drizzle-orm";
import { skillScores, tierFor } from "@iq/core";
import {
  assessments, briefVersions, credentials, enrollments, projects, skillEvidence, skills, submissions, xpTransactions, type Db,
} from "@iq/db";
import { audit, notify, track } from "./notify";

const TITLE = { emerging: "Emerging", bronze: "Bronze" } as const;

// PRD §10.2, §13.3, AC-10/11/17. Every row has a unique idempotency key, so running this twice
// (a retry, a double click, a crash halfway) never issues anything twice.
export async function issueRewards(db: Db, enrollmentId: string) {
  const issued = await db.transaction(async (tx) => {
    const [row] = await tx.select({ e: enrollments, v: briefVersions, orgId: projects.orgId }).from(enrollments)
      .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
      .innerJoin(projects, eq(projects.id, enrollments.projectId))
      .where(eq(enrollments.id, enrollmentId)).for("update");
    if (!row || row.e.state !== "completed" || row.e.rewardsStatus === "issued") return null;
    const { e, v } = row;
    const [a] = await tx.select({ a: assessments }).from(assessments)
      .innerJoin(submissions, eq(submissions.id, assessments.submissionId))
      .where(and(eq(submissions.enrollmentId, e.id), eq(assessments.decision, "accept")))
      .orderBy(desc(assessments.createdAt)).limit(1);
    if (!a) throw new Error(`Completed enrollment ${e.id} has no accepting assessment`);

    await tx.insert(xpTransactions).values({
      userId: e.studentId, amount: v.xp, kind: "issue", enrollmentId: e.id,
      reason: `Accepted completion: ${v.title}`, idempotencyKey: `xp:${e.id}:base`,
    }).onConflictDoNothing();

    await tx.insert(credentials).values({
      userId: e.studentId, enrollmentId: e.id, kind: "completion", title: `Verified completion: ${v.title}`,
      summary: v.summary, idempotencyKey: `completion:${e.id}`,
    }).onConflictDoNothing();

    await tx.insert(credentials).values({
      userId: e.studentId, enrollmentId: e.id, kind: "achievement", title: "First Quest",
      summary: "Completed a first verified industry project.", idempotencyKey: `achievement:${e.studentId}:first-quest`,
    }).onConflictDoNothing();

    // Skill evidence only from criteria mapped to a skill, only at 3/4 or better (§10.4).
    const scores = skillScores(v.content.rubric, a.a.scores);
    for (const [skillId, score] of scores) {
      await tx.insert(skillEvidence).values({
        userId: e.studentId, skillId, projectId: e.projectId, enrollmentId: e.id, assessmentId: a.a.id, assessorId: a.a.assessorId, score,
      }).onConflictDoNothing();
    }
    const skillIds = [...scores.keys()];
    if (skillIds.length) {
      const evidence = await tx.select().from(skillEvidence)
        .where(and(eq(skillEvidence.userId, e.studentId), inArray(skillEvidence.skillId, skillIds)));
      const names = Object.fromEntries((await tx.select().from(skills).where(inArray(skills.id, skillIds))).map((s) => [s.id, s.name]));
      for (const skillId of skillIds) {
        const tier = tierFor(evidence.filter((x) => x.skillId === skillId));
        if (tier === "none") continue;
        await tx.insert(credentials).values({
          userId: e.studentId, enrollmentId: e.id, kind: "skill_tier", skillId, tier,
          title: `${TITLE[tier]}: ${names[skillId]}`, summary: `Reviewed evidence in ${names[skillId]}.`,
          idempotencyKey: `skill:${e.studentId}:${skillId}:${tier}`,
        }).onConflictDoNothing();
      }
    }
    await tx.update(enrollments).set({ rewardsStatus: "issued" }).where(eq(enrollments.id, e.id));
    await track(tx, "credential_issued", e.id, null, { xp: v.xp, skills: skillIds.length });
    await audit(tx, null, "credentials_issued", "enrollment", e.id);
    return { studentId: e.studentId, xp: v.xp };
  });
  if (issued) await notify(db, { userId: issued.studentId, kind: "credential", essential: true, title: `You earned ${issued.xp} XP and a verified record`,
    href: "/profile?tab=credentials", key: `rewards:${enrollmentId}` });
}

// ponytail: retry-on-read; add a Cloudflare Cron Trigger or Queue if pending rows pile up.
export async function issuePendingFor(db: Db, studentId: string) {
  const pending = await db.select({ id: enrollments.id }).from(enrollments)
    .where(and(eq(enrollments.studentId, studentId), eq(enrollments.rewardsStatus, "pending")));
  for (const p of pending) await issueRewards(db, p.id).catch((err) => console.error("issueRewards failed", p.id, err));
}
