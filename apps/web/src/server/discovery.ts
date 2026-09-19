import { and, desc, eq, gt, ilike, inArray, or, sql } from "drizzle-orm";
import { SEAT_STATES, explainFit, tierFor, type Tier } from "@iq/core";
import {
  briefVersions, enrollments, organizations, projects, savedProjects, skillEvidence, skills, studentProfiles, user, type Db, type Tx,
} from "@iq/db";
import type { Actor } from "./authz";
import { UserError } from "./errors";

// Places held: participating students plus offers that haven't expired (PRD §11.3).
export async function seatsTaken(db: Db | Tx, projectIds: string[]) {
  if (!projectIds.length) return new Map<string, number>();
  const rows = await db.select({ id: enrollments.projectId, n: sql<number>`count(*)::int` }).from(enrollments)
    .where(and(inArray(enrollments.projectId, projectIds), or(
      inArray(enrollments.state, [...SEAT_STATES]),
      and(eq(enrollments.state, "offered"), gt(enrollments.offerExpiresAt, sql`now()`)),
    )))
    .groupBy(enrollments.projectId);
  return new Map(rows.map((r) => [r.id, r.n]));
}

// Tiers are derived from evidence on every read, so a rule change or a revoked credential shows up at once.
export async function studentTiers(db: Db, userId: string): Promise<Record<string, Tier>> {
  const rows = await db.select().from(skillEvidence).where(eq(skillEvidence.userId, userId));
  const bySkill = Object.groupBy(rows, (r) => r.skillId);
  return Object.fromEntries(Object.entries(bySkill).map(([id, ev]) => [id, tierFor(ev!)]));
}

export const skillNames = async (db: Db) => Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));

export type Filters = {
  q?: string; skill?: string; tier?: string; beginner?: boolean; compensation?: string;
  maxHours?: number; openOnly?: boolean; includeInactive?: boolean; saved?: boolean;
  discipline?: string; orgId?: string; closingWithinDays?: number;
};

// Listing states a visitor may see. Paused and closed stay visible on request (DIS-07) but never by default.
const VISIBLE = ["published", "paused", "closed"] as const;

export async function listProjects(db: Db, viewer: Actor | null, f: Filters) {
  const content = briefVersions.content;
  const where = [
    inArray(projects.state, f.includeInactive ? [...VISIBLE] : ["published"]),
    f.q?.trim() ? or(
      ilike(briefVersions.title, `%${f.q.trim()}%`),
      ilike(briefVersions.summary, `%${f.q.trim()}%`),
      ilike(organizations.name, `%${f.q.trim()}%`),
      sql`${content}->>'problem' ilike ${`%${f.q.trim()}%`}`,
    ) : undefined, // ponytail: ILIKE scan; Postgres full-text search once the catalog passes a few hundred briefs
    f.skill ? sql`${content}->'skillIds' ? ${f.skill}` : undefined,
    f.tier ? eq(briefVersions.tier, f.tier) : undefined,
    f.beginner ? eq(briefVersions.beginner, true) : undefined,
    f.compensation ? sql`${content}->>'compensation' = ${f.compensation}` : undefined,
    f.maxHours ? sql`(${content}->>'effortHours')::int <= ${f.maxHours}` : undefined,
    f.discipline ? sql`${content}->>'discipline' = ${f.discipline}` : undefined,
    f.orgId ? eq(projects.orgId, f.orgId) : undefined,
    f.closingWithinDays ? sql`${content}->>'applyDeadline' <= ${new Date(Date.now() + f.closingWithinDays * 864e5).toISOString().slice(0, 10)}` : undefined,
    f.saved && viewer ? sql`exists (select 1 from ${savedProjects} where ${savedProjects.projectId} = ${projects.id} and ${savedProjects.userId} = ${viewer.id})` : undefined,
  ];
  const rows = await db
    .select({ id: projects.id, state: projects.state, brief: briefVersions, org: organizations.name, mentor: user.name, updatedAt: projects.updatedAt })
    .from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .leftJoin(user, eq(user.id, briefVersions.mentorId))
    .where(and(...where))
    .orderBy(desc(projects.updatedAt));

  const taken = await seatsTaken(db, rows.map((r) => r.id));
  const names = await skillNames(db);
  const [profile] = viewer ? await db.select().from(studentProfiles).where(eq(studentProfiles.userId, viewer.id)) : [];
  const tiers = profile ? await studentTiers(db, viewer!.id) : {};
  const mine = new Map(viewer
    ? (await db.select({ id: enrollments.projectId, state: enrollments.state }).from(enrollments)
        .where(and(eq(enrollments.studentId, viewer.id), inArray(enrollments.state, ["applied", "offered", "active", "submitted", "revision_requested", "completed"]))))
        .map((m) => [m.id, m.state])
    : []);
  const saved = new Set(viewer
    ? (await db.select({ id: savedProjects.projectId }).from(savedProjects).where(eq(savedProjects.userId, viewer.id))).map((s) => s.id)
    : []);

  const cards = rows.map((r) => {
    const b = r.brief.content;
    const openPlaces = Math.max(0, r.brief.capacity - (taken.get(r.id) ?? 0));
    const fit = profile
      ? explainFit(
          { interests: profile.interests, weeklyHours: profile.weeklyHours, tiers },
          { text: `${b.title} ${b.summary}`, skills: b.skillIds.map((id) => ({ id, name: names[id] ?? id })), effortHours: b.effortHours, beginner: b.beginner, prerequisites: b.prerequisites },
        )
      : null;
    return { ...r, b, openPlaces, fit, saved: saved.has(r.id), myState: mine.get(r.id) ?? null };
  }).filter((c) => !f.openOnly || (c.state === "published" && c.openPlaces > 0));

  // For students: eligible, open projects with the best fit first (§11.2). Everyone else: newest first.
  if (profile) {
    const rank = (c: (typeof cards)[number]) => (c.state !== "published" || !c.openPlaces || c.myState ? -100 : 0) + (c.fit?.score ?? 0);
    cards.sort((a, b) => rank(b) - rank(a));
  }
  return { cards, names, tiers, isStudent: !!profile };
}

export async function toggleSaved(db: Db, actor: Actor, projectId: string) {
  const [p] = await db.select({ state: projects.state }).from(projects).where(eq(projects.id, projectId));
  if (!p || !VISIBLE.includes(p.state as (typeof VISIBLE)[number])) throw new UserError("That project isn't available.");
  const deleted = await db.delete(savedProjects)
    .where(and(eq(savedProjects.userId, actor.id), eq(savedProjects.projectId, projectId))).returning();
  if (!deleted.length) await db.insert(savedProjects).values({ userId: actor.id, projectId });
  return !deleted.length;
}

// Options for the discipline and company filters: only values that appear on visible listings.
export async function filterOptions(db: Db) {
  const rows = await db.selectDistinct({ discipline: sql<string>`${briefVersions.content}->>'discipline'`, orgId: organizations.id, org: organizations.name })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId)).innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(inArray(projects.state, [...VISIBLE]));
  return {
    disciplines: [...new Set(rows.map((r) => r.discipline).filter(Boolean))].sort(),
    orgs: [...new Map(rows.map((r) => [r.orgId, r.org])).entries()].map(([value, label]) => ({ value, label })),
  };
}
