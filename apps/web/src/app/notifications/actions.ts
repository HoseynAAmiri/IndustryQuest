"use server";
import { and, eq, isNull } from "drizzle-orm";
import { notificationPrefs, notifications } from "@iq/db";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";

export async function markAllRead() {
  const u = await requireUser();
  await act("/notifications", () => getDb().update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.userId, u.id), isNull(notifications.readAt))), { info: "All caught up." });
}

export async function savePrefs(f: FormData) {
  const u = await requireUser();
  const hour = (k: string) => Math.max(0, Math.min(23, Number(f.get(k)) || 0));
  const tz = String(f.get("timezone") ?? "UTC");
  const values = {
    emailOptional: f.get("emailOptional") === "on", quietStart: hour("quietStart"), quietEnd: hour("quietEnd"),
    timezone: Intl.supportedValuesOf("timeZone").includes(tz) ? tz : "UTC",
  };
  await act("/notifications", () => getDb().insert(notificationPrefs).values({ userId: u.id, ...values })
    .onConflictDoUpdate({ target: notificationPrefs.userId, set: values }), { info: "Notification settings saved." });
}
