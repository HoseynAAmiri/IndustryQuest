import { and, eq } from "drizzle-orm";
import { shouldEmail } from "@iq/core";
import { auditEvents, events, memberships, notificationPrefs, notifications, studentProfiles, user, type Db, type Tx } from "@iq/db";
import { sendEmail } from "./email";

type Note = { userId: string; kind: string; title: string; body?: string; href: string; key: string; essential?: boolean };

// NTF-01..06. One row per event; the unique key makes retries and double clicks harmless (NTF-05).
// Email carries a safe summary and a sign-in link, never file contents (NTF-04).
export async function notify(db: Db, n: Note) {
  const [row] = await db.insert(notifications).values({
    userId: n.userId, kind: n.kind, title: n.title, body: n.body ?? "", href: n.href, essential: !!n.essential, dedupeKey: n.key,
  }).onConflictDoNothing().returning();
  if (!row) return;
  const [u] = await db.select({ email: user.email }).from(user).where(eq(user.id, n.userId));
  const [prefs] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, n.userId));
  const [profile] = await db.select({ tz: studentProfiles.timezone }).from(studentProfiles).where(eq(studentProfiles.userId, n.userId));
  const p = prefs ?? { emailOptional: true, quietStart: 22, quietEnd: 7, timezone: profile?.tz ?? "UTC" };
  if (!u || !shouldEmail(row.essential, p)) return;
  try {
    const link = new URL(n.href, process.env.BETTER_AUTH_URL ?? "http://localhost:3000").href;
    await sendEmail(u.email, n.title, `${n.body ? `${n.body}\n\n` : ""}Open IndustryQuest: ${link}`);
    await db.update(notifications).set({ emailedAt: new Date() }).where(eq(notifications.id, row.id));
  } catch (e) {
    // A failed email is not proof of delivery; keep it visible to staff and leave the in-app copy.
    await db.update(notifications).set({ emailError: String(e).slice(0, 500) }).where(eq(notifications.id, row.id));
  }
}

export const notifyAll = (db: Db, userIds: string[], n: Omit<Note, "userId" | "key"> & { key: string }) =>
  Promise.all([...new Set(userIds)].map((userId) => notify(db, { ...n, userId, key: `${n.key}:${userId}` })));

// ANL-01: opaque ids and plain properties only.
export async function track(db: Db | Tx, name: string, subjectId: string | null, actorId: string | null, props: Record<string, string | number | boolean | null> = {}) {
  await db.insert(events).values({ name, subjectId, actorId, props });
}

// OPS-07: consequential and sensitive actions leave an attributable record.
export async function audit(db: Db | Tx, actorId: string | null, action: string, targetType: string, targetId: string, reason?: string, meta: Record<string, unknown> = {}) {
  const [event] = await db.insert(auditEvents).values({ actorId, action, targetType, targetId, reason, meta }).returning();
  return event;
}

export async function ownersOf(db: Db, orgId: string) {
  return (await db.select({ id: memberships.userId }).from(memberships)
    .where(and(eq(memberships.orgId, orgId), eq(memberships.role, "owner")))).map((r) => r.id);
}

export async function staffIds(db: Db) {
  return (await db.select({ id: user.id }).from(user).where(eq(user.isStaff, true))).map((r) => r.id);
}
