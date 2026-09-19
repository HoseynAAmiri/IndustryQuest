import { and, eq } from "drizzle-orm";
import { memberships, studentProfiles, user, type Db } from "@iq/db";
import { Forbidden, UserError } from "./errors";
import { isDemo } from "./demo";

export type Actor = { id: string };


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
  const [u] = await db.select({ isStaff: user.isStaff, twoFactorEnabled: user.twoFactorEnabled }).from(user).where(eq(user.id, actor.id));
  if (!u?.isStaff) throw new Forbidden();
  if (!isDemo() && !u.twoFactorEnabled) throw new UserError("Turn on two-factor sign-in in Security before making staff changes.");
}

export async function assertOrgRole(db: Db, actor: Actor, orgId: string, role: "owner" | "mentor") {
  const [m] = await db.select().from(memberships)
    .where(and(eq(memberships.userId, actor.id), eq(memberships.orgId, orgId), eq(memberships.role, role)));
  if (!m) throw new Forbidden();
  if (role === "owner" && !isDemo()) {
    const [u] = await db.select({ twoFactorEnabled: user.twoFactorEnabled }).from(user).where(eq(user.id, actor.id));
    if (!u?.twoFactorEnabled) throw new UserError("Turn on two-factor sign-in in Security before changing organization data.");
  }
}
