"use server";
import { redirect } from "next/navigation";
import { skillClaims, studentProfiles } from "@iq/db";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { registerCompany } from "@/server/company";
import { getDb } from "@/server/db";
import { PARTICIPATION } from "@/server/profile";

export async function saveProfile(form: FormData) {
  const user = await requireUser();
  const skip = form.get("skip") === "1";
  const tz = String(form.get("timezone") ?? "UTC");
  const mode = String(form.get("participation") ?? "remote");
  const values = skip
    ? { userId: user.id }
    : {
        userId: user.id,
        interests: String(form.get("interests") ?? "").split(",").map((s) => s.trim()).filter(Boolean).slice(0, 20),
        goals: String(form.get("goals") ?? "").slice(0, 1000),
        weeklyHours: Math.max(0, Math.min(60, Number(form.get("weeklyHours")) || 0)),
        timezone: Intl.supportedValuesOf("timeZone").includes(tz) ? tz : "UTC",
        participation: (mode in PARTICIPATION ? mode : "remote") as keyof typeof PARTICIPATION,
      };
  const db = getDb();
  await db.insert(studentProfiles).values(values).onConflictDoUpdate({ target: studentProfiles.userId, set: values });
  const picked = skip ? [] : form.getAll("skills").map(String).slice(0, 10);
  if (picked.length) await db.insert(skillClaims).values(picked.map((skillId) => ({ userId: user.id, skillId, level: "coursework" as const }))).onConflictDoNothing();
  redirect("/explore?info=" + encodeURIComponent("Welcome! Here are projects that fit you. Self-reported skills can be refined in your profile."));
}

export async function companyAction(form: FormData) {
  const user = await requireUser();
  await act("/onboarding?role=company", () => registerCompany(getDb(), user, {
    name: String(form.get("name") ?? ""), description: String(form.get("description") ?? ""), challenge: String(form.get("challenge") ?? ""),
  }), { to: "/company", info: "Organization created. Staff will verify it; meanwhile you can draft briefs." });
}
