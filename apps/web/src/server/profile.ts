import { and, eq } from "drizzle-orm";
import { memberships, mentorProfiles, skillClaims, skills, studentProfiles, user, type Db } from "@iq/db";
import type { Actor } from "./authz";
import { UserError } from "./errors";

export const CLAIM_LEVELS = {
  learning: "Learning it now",
  coursework: "Used in coursework",
  practical: "Used in real work",
} as const;
type Level = keyof typeof CLAIM_LEVELS;

export async function updateProfile(db: Db, actor: Actor, input: {
  name: string; pronouns: string; discipline: string; bio: string; interests: string; goals: string; weeklyHours: number; timezone: string;
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
