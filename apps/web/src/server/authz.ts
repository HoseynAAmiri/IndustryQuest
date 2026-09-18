import "server-only";
import { and, eq } from "drizzle-orm";
import { memberships, studentProfiles, user, type Db } from "@iq/db";

export type Actor = { id: string };

export class Forbidden extends Error {
  constructor(message = "You don't have access to this.") { super(message); }
}

export async function getRoles(db: Db, userId: string) {
  const [u] = await db.select({ isStaff: user.isStaff }).from(user).where(eq(user.id, userId));
  const [profile] = await db.select({ userId: studentProfiles.userId }).from(studentProfiles).where(eq(studentProfiles.userId, userId));
  const orgs = await db.select().from(memberships).where(eq(memberships.userId, userId));
  return {
    isStaff: !!u?.isStaff,
    isStudent: !!profile,
    ownerOf: orgs.filter((m) => m.role === "owner").map((m) => m.orgId),
    mentorOf: orgs.filter((m) => m.role === "mentor").map((m) => m.orgId),
  };
}

export async function assertStaff(db: Db, actor: Actor) {
  if (!(await getRoles(db, actor.id)).isStaff) throw new Forbidden();
}

export async function assertOrgRole(db: Db, actor: Actor, orgId: string, role: "owner" | "mentor") {
  const [m] = await db.select().from(memberships)
    .where(and(eq(memberships.userId, actor.id), eq(memberships.orgId, orgId), eq(memberships.role, role)));
  if (!m) throw new Forbidden();
}
