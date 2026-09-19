"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { proposeSummary, setCredentialPublic } from "@/server/credentials";
import { getDb } from "@/server/db";
import { removeSkillClaim, setSkillClaim, setVisibility, updateProfile } from "@/server/profile";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { getAuth } from "@/server/auth";
import { UserError } from "@/server/errors";

export async function shareAction(f: FormData) {
  const u = await requireUser();
  const isPublic = f.get("public") === "1";
  const days = Number(f.get("days")) || undefined;
  await act("/profile?tab=credentials", () => setCredentialPublic(getDb(), u, { credentialId: String(f.get("credentialId")), isPublic, days }),
    { info: isPublic ? "Public link turned on. Anyone with the link can verify it." : "Public link turned off. The old link stops working now." });
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function saveProfileAction(f: FormData) {
  const u = await requireUser();
  await act("/profile?tab=details", () => updateProfile(getDb(), u, {
    name: str(f, "name"), pronouns: str(f, "pronouns"), discipline: str(f, "discipline"), bio: str(f, "bio"),
    interests: str(f, "interests"), goals: str(f, "goals"), weeklyHours: Number(str(f, "weeklyHours")), timezone: str(f, "timezone"),
    participation: str(f, "participation"),
  }), { info: "Profile saved." });
}

export async function skillAction(f: FormData) {
  const u = await requireUser();
  const skillId = str(f, "skillId");
  if (f.get("intent") === "remove")
    return act("/profile?tab=skills", () => removeSkillClaim(getDb(), u, skillId), { info: "Skill removed." });
  await act("/profile?tab=skills", () => setSkillClaim(getDb(), u, { skillId, level: str(f, "level"), note: str(f, "note") }), { info: "Skills updated." });
}

export async function visibilityAction(f: FormData) {
  const u = await requireUser();
  const newLink = f.get("intent") === "new-link";
  await act("/profile?tab=details", () => setVisibility(getDb(), u, { visibility: str(f, "visibility"), newLink }),
    { info: newLink ? "New link created. The old one no longer works." : "Sharing updated." });
}

export async function changeEmailAction(f: FormData) {
  await requireUser();
  const newEmail = str(f, "email").trim();
  await act("/profile?tab=details", async () => {
    try {
      await getAuth().api.changeEmail({ body: { newEmail, callbackURL: "/profile?tab=details&info=Email%20changed." }, headers: await headers() });
    } catch (e) {
      if (e instanceof APIError) throw new UserError(e.body?.message ?? "That email can't be used.");
      throw e;
    }
  }, { info: `If ${newEmail} can be used, a confirmation link is on its way there. Your email changes when you open it.` });

}

export async function summaryAction(f: FormData) {
  const u = await requireUser();
  await act("/profile?tab=credentials", () => proposeSummary(getDb(), u, { credentialId: str(f, "credentialId"), summary: str(f, "summary") }),
    { info: "Sent to the company to check for confidential details." });
}
