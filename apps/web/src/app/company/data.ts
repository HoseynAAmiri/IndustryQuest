import { and, asc, eq } from "drizzle-orm";
import { memberships, skills, user, type Db } from "@iq/db";

export async function formOptions(db: Db, orgId: string) {
  const mentors = await db.select({ id: user.id, name: user.name }).from(memberships)
    .innerJoin(user, eq(user.id, memberships.userId))
    .where(and(eq(memberships.orgId, orgId), eq(memberships.role, "mentor"))).orderBy(asc(user.name));
  return { mentors, skills: await db.select().from(skills).where(eq(skills.active, true)).orderBy(asc(skills.name)) };
}
