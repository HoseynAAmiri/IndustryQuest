import { and, asc, desc, eq, isNull } from "drizzle-orm";
import {
  briefVersions, credentials, dismissedProjects, enrollments, equivalencies, memberships, mentorProfiles, organizations, projects, skillClaims,
  skillEvidence, skills, studentProfiles, submissions, assessments, user, xpTransactions, type Db,
} from "@iq/db";
import { tierFor } from "@iq/core";
import type { Actor } from "./authz";
import { UserError } from "./errors";

export const CLAIM_LEVELS = {
  learning: "Learning it now",
  coursework: "Used in coursework",
  practical: "Used in real work",
} as const;
type Level = keyof typeof CLAIM_LEVELS;

export const PARTICIPATION = { remote: "Remote", hybrid: "Hybrid", onsite: "On-site", any: "Any" } as const;

export async function updateProfile(db: Db, actor: Actor, input: {
  name: string; pronouns: string; discipline: string; bio: string; interests: string; goals: string; weeklyHours: number; timezone: string;
  participation?: string;
}) {
  const name = input.name.trim();
  if (name.length < 2) throw new UserError("Add the name you'd like people to see.");
  const values = {
    pronouns: input.pronouns.trim().slice(0, 40),
    discipline: input.discipline.trim().slice(0, 80),
    bio: input.bio.trim().slice(0, 600),
    interests: input.interests.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
    goals: input.goals.trim().slice(0, 1000),
    weeklyHours: Math.max(0, Math.min(60, Math.round(input.weeklyHours) || 0)),
    timezone: Intl.supportedValuesOf("timeZone").includes(input.timezone) ? input.timezone : "UTC",
    participation: (input.participation && input.participation in PARTICIPATION ? input.participation : "remote") as keyof typeof PARTICIPATION,
  };
  await db.update(user).set({ name: name.slice(0, 80), updatedAt: new Date() }).where(eq(user.id, actor.id));
  await db.insert(studentProfiles).values({ userId: actor.id, ...values }).onConflictDoUpdate({ target: studentProfiles.userId, set: values });
}

export async function setSkillClaim(db: Db, actor: Actor, input: { skillId: string; level: string; note: string }) {
  if (!(input.level in CLAIM_LEVELS)) throw new UserError("Choose how you've used this skill.");
  const [skill] = await db.select().from(skills).where(eq(skills.id, input.skillId));
  if (!skill) throw new UserError("Choose a skill from the list.");
  const values = { level: input.level as Level, note: input.note.trim().slice(0, 300) };
  await db.insert(skillClaims).values({ userId: actor.id, skillId: skill.id, ...values })
    .onConflictDoUpdate({ target: [skillClaims.userId, skillClaims.skillId], set: values });
}

export async function removeSkillClaim(db: Db, actor: Actor, skillId: string) {
  await db.delete(skillClaims).where(and(eq(skillClaims.userId, actor.id), eq(skillClaims.skillId, skillId)));
}

// MEN-01/03: professional context and the number of mentees the mentor can take on.
export async function updateMentorProfile(db: Db, actor: Actor, input: { headline: string; expertise: string; capacity: number; timezone: string }) {
  const [m] = await db.select().from(memberships).where(and(eq(memberships.userId, actor.id), eq(memberships.role, "mentor")));
  if (!m) throw new UserError("Only mentors have a mentor profile.");
  const values = {
    headline: input.headline.trim().slice(0, 120),
    expertise: input.expertise.split(",").map((x) => x.trim()).filter(Boolean).slice(0, 10),
    capacity: Math.max(1, Math.min(10, Math.round(input.capacity) || 1)),
    timezone: Intl.supportedValuesOf("timeZone").includes(input.timezone) ? input.timezone : "UTC",
  };
  await db.insert(mentorProfiles).values({ userId: actor.id, ...values }).onConflictDoUpdate({ target: mentorProfiles.userId, set: values });
}

// PRO-04, AC-19: a new token makes the previous link stop working at once.
export async function setVisibility(db: Db, actor: Actor, input: { visibility: string; newLink?: boolean }) {
  if (!["private", "link", "public"].includes(input.visibility)) throw new UserError("Choose who can see your profile.");
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, actor.id));
  if (!p) throw new UserError("Finish your profile first.");
  const token = input.visibility === "private" ? p.shareToken : input.newLink || !p.shareToken ? crypto.randomUUID().replaceAll("-", "") : p.shareToken;
  await db.update(studentProfiles).set({ visibility: input.visibility as "private" | "link" | "public", shareToken: token }).where(eq(studentProfiles.userId, actor.id));
}

// What a shared profile shows: chosen identity fields, verified skills, public credentials and approved
// summaries. Never contact details, availability, reflections, applications or company files (PRO-05).
export async function sharedProfile(db: Db, token: string) {
  const [row] = await db.select({ p: studentProfiles, u: user }).from(studentProfiles).innerJoin(user, eq(user.id, studentProfiles.userId))
    .where(eq(studentProfiles.shareToken, token));
  if (!row || row.p.visibility === "private") return null;
  const ev = await db.select().from(skillEvidence).where(and(eq(skillEvidence.userId, row.u.id), isNull(skillEvidence.revokedAt)));
  const names = Object.fromEntries((await db.select().from(skills)).map((k) => [k.id, k.name]));
  const skillTiers = Object.entries(Object.groupBy(ev, (e) => e.skillId)).map(([id, rows]) => ({ name: names[id], tier: tierFor(rows!) })).filter((t) => t.tier !== "none");
  const creds = (await db.select().from(credentials).where(and(eq(credentials.userId, row.u.id), eq(credentials.isPublic, true), eq(credentials.status, "active"))))
    .filter((c) => !c.publicUntil || c.publicUntil > new Date());
  const done = await db.select({ e: enrollments, title: briefVersions.title, org: organizations.name }).from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId)).where(and(eq(enrollments.studentId, row.u.id), eq(enrollments.state, "completed")));
  return {
    name: row.u.name, image: row.u.image ? `/api/avatar/${row.u.id}` : null, pronouns: row.p.pronouns, discipline: row.p.discipline, bio: row.p.bio,
    skillTiers, creds, completed: done.map((d) => ({ ...d, summary: creds.find((c) => c.enrollmentId === d.e.id && c.summaryStatus === "approved")?.proposedSummary ?? null })),
  };
}

export async function toggleDismissed(db: Db, actor: Actor, projectId: string) {
  const gone = await db.delete(dismissedProjects).where(and(eq(dismissedProjects.userId, actor.id), eq(dismissedProjects.projectId, projectId))).returning();
  if (!gone.length) await db.insert(dismissedProjects).values({ userId: actor.id, projectId });
  return !gone.length;
}

// PRO-12, CRD-05: everything that belongs to the student, readable by people and machines. Company files and
// other participants' data are left out; files are listed by reference only.
export async function exportRecord(db: Db, userId: string) {
  const [u] = await db.select({ name: user.name, email: user.email }).from(user).where(eq(user.id, userId));
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
  const work = await db.select({ e: enrollments, title: briefVersions.title, version: briefVersions.version, org: organizations.name }).from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId)).where(eq(enrollments.studentId, userId)).orderBy(asc(enrollments.createdAt));
  const reviews = await db.select({ a: assessments, s: submissions }).from(assessments).innerJoin(submissions, eq(submissions.id, assessments.submissionId))
    .innerJoin(enrollments, eq(enrollments.id, submissions.enrollmentId)).where(eq(enrollments.studentId, userId));
  return {
    exportedAt: new Date().toISOString(),
    format: "IndustryQuest learner record v1",
    person: { name: u.name, email: u.email, pronouns: p?.pronouns, discipline: p?.discipline, bio: p?.bio, interests: p?.interests },
    projects: work.map((w) => ({
      title: w.title, company: w.org, briefVersion: w.version, status: w.e.state, appliedAt: w.e.createdAt, acceptedAt: w.e.acceptedAt, completedAt: w.e.completedAt,
      submissions: reviews.filter((r) => r.s.enrollmentId === w.e.id).map((r) => ({
        version: r.s.version, submittedAt: r.s.createdAt, contribution: r.s.contributionStatement, fileReferences: r.s.fileIds,
        review: { decision: r.a.decision, scores: r.a.scores, comment: r.a.comment, reviewedAt: r.a.createdAt },
      })),
    })),
    credentials: (await db.select().from(credentials).where(eq(credentials.userId, userId))).map((c) => ({
      id: c.id, title: c.title, kind: c.kind, status: c.status, issuedAt: c.issuedAt, verifyAt: `/credentials/${c.id}`,
    })),
    skillEvidence: (await db.select({ ev: skillEvidence, skill: skills.name }).from(skillEvidence).innerJoin(skills, eq(skills.id, skillEvidence.skillId))
      .where(eq(skillEvidence.userId, userId))).map((r) => ({ skill: r.skill, score: r.ev.score, at: r.ev.createdAt, revoked: !!r.ev.revokedAt })),
    selfReportedSkills: (await db.select({ c: skillClaims, skill: skills.name }).from(skillClaims).innerJoin(skills, eq(skills.id, skillClaims.skillId))
      .where(eq(skillClaims.userId, userId))).map((r) => ({ skill: r.skill, level: r.c.level, note: r.c.note })),
    equivalencies: (await db.select({ q: equivalencies, skill: skills.name }).from(equivalencies).innerJoin(skills, eq(skills.id, equivalencies.skillId))
      .where(eq(equivalencies.userId, userId))).map((r) => ({ skill: r.skill, acceptedAt: r.q.createdAt, note: "Accepted outside evidence; not a platform credential" })),
    xp: (await db.select().from(xpTransactions).where(eq(xpTransactions.userId, userId)).orderBy(desc(xpTransactions.createdAt)))
      .map((t) => ({ amount: t.amount, kind: t.kind, reason: t.reason, at: t.createdAt })),
  };
}
