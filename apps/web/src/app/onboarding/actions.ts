"use server";
import { redirect } from "next/navigation";
import { studentProfiles } from "@iq/db";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";

export async function saveProfile(form: FormData) {
  const user = await requireUser();
  const skip = form.get("skip") === "1";
  const tz = String(form.get("timezone") ?? "UTC");
  const values = skip
    ? { userId: user.id }
    : {
        userId: user.id,
        interests: String(form.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
        goals: String(form.get("goals") ?? "").slice(0, 1000),
        weeklyHours: Math.max(0, Math.min(60, Number(form.get("weeklyHours")) || 0)),
        timezone: Intl.supportedValuesOf("timeZone").includes(tz) ? tz : "UTC",
      };
  await getDb().insert(studentProfiles).values(values).onConflictDoUpdate({ target: studentProfiles.userId, set: values });
  redirect("/explore");
}
