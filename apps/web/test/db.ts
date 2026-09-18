import { sql } from "drizzle-orm";
import { afterAll, beforeEach } from "vitest";
import { briefSchema, type Brief } from "@iq/core";
import { connect, memberships, organizations, skills, studentProfiles, user } from "@iq/db";

// Shared by integration tests: a clean database before each test, plus small fixtures.
export const db = connect(process.env.DATABASE_URL!);

beforeEach(async () => {
  await db.execute(sql`truncate table "user", organizations, skills restart identity cascade`);
});
afterAll(() => db.pool.end());

export async function makeUser(id: string, extra: { isStaff?: boolean; student?: boolean } = {}) {
  await db.insert(user).values({ id, name: id, email: `${id}@test.local`, emailVerified: true, isStaff: !!extra.isStaff });
  if (extra.student) await db.insert(studentProfiles).values({ userId: id });
  return { id };
}

export async function makeOrg(opts: { verified?: boolean; owner: string; mentors?: string[] }) {
  const [org] = await db.insert(organizations).values({ name: "Test Org", verifiedAt: opts.verified === false ? null : new Date() }).returning();
  await db.insert(memberships).values([
    { userId: opts.owner, orgId: org.id, role: "owner" as const },
    ...(opts.mentors ?? []).map((m) => ({ userId: m, orgId: org.id, role: "mentor" as const })),
  ]);
  return org;
}

export async function makeSkill(id: string) {
  await db.insert(skills).values({ id, name: id });
}

export const brief = (b: Partial<Brief> = {}): Brief =>
  briefSchema.parse({
    title: "Vibration spectrum", summary: "Find the dominant frequencies in a pump dataset.", problem: "Bearings wear out.",
    tier: "Q1", beginner: true, effortHours: 4, capacity: 1, mentorId: "", backupContact: "ops@test.local",
    compensation: "unpaid", compensationDetails: "", applyDeadline: "2099-01-01", deliverables: ["Notebook"],
    milestones: [{ title: "Final", dueInDays: 7 }], resources: "", terms: "Portfolio summary allowed.",
    skillIds: [], prerequisites: [],
    rubric: [{ id: "c1", name: "Analysis", description: "", critical: true, threshold: 3 }],
    ...b,
  });
