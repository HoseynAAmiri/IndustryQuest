import { and, eq } from "drizzle-orm";
import { briefVersions, credentials, enrollments, organizations, projects, user, type Db } from "@iq/db";
import type { Actor } from "./authz";
import { Forbidden } from "./errors";

// PRD §16.1: public verification is student-initiated and can be revoked at any time (AC-19).
export async function setCredentialPublic(db: Db, actor: Actor, input: { credentialId: string; isPublic: boolean }) {
  const res = await db.update(credentials).set({ isPublic: input.isPublic })
    .where(and(eq(credentials.id, input.credentialId), eq(credentials.userId, actor.id))).returning();
  if (!res.length) throw new Forbidden();
}

// CRD-02 and AC-14: the public page gets the approved summary and permitted identity fields only.
// No files, no scores, no private feedback, no confidential company material.
export async function publicCredential(db: Db, id: string, viewer: Actor | null) {
  const [row] = await db.select({
    c: credentials, holder: user.name, project: briefVersions.title, tier: briefVersions.tier,
    org: organizations.name, mentorId: enrollments.mentorId, completedAt: enrollments.completedAt,
  }).from(credentials)
    .innerJoin(user, eq(user.id, credentials.userId))
    .leftJoin(enrollments, eq(enrollments.id, credentials.enrollmentId))
    .leftJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .leftJoin(projects, eq(projects.id, enrollments.projectId))
    .leftJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(credentials.id, id)).catch(() => []);
  if (!row || (!row.c.isPublic && row.c.userId !== viewer?.id)) return null;
  const [mentor] = row.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, row.mentorId)) : [];
  return { ...row, mentor: mentor?.name ?? null };
}
