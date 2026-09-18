"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { setCredentialPublic } from "@/server/credentials";
import { getDb } from "@/server/db";
import { removeSkillClaim, setSkillClaim, updateProfile } from "@/server/profile";

export async function shareAction(f: FormData) {
  const u = await requireUser();
  const isPublic = f.get("public") === "1";
  await act("/profile#credentials", () => setCredentialPublic(getDb(), u, { credentialId: String(f.get("credentialId")), isPublic }),
    { info: isPublic ? "Public link turned on. Anyone with the link can verify it." : "Public link turned off. The old link stops working now." });
}

const str = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function saveProfileAction(f: FormData) {
  const u = await requireUser();
  await act("/profile/edit", () => updateProfile(getDb(), u, {
    name: str(f, "name"), pronouns: str(f, "pronouns"), discipline: str(f, "discipline"), bio: str(f, "bio"),
    interests: str(f, "interests"), goals: str(f, "goals"), weeklyHours: Number(str(f, "weeklyHours")), timezone: str(f, "timezone"),
  }), { info: "Profile saved." });
}

export async function skillAction(f: FormData) {
  const u = await requireUser();
  const skillId = str(f, "skillId");
  if (f.get("intent") === "remove")
    return act("/profile/skills", () => removeSkillClaim(getDb(), u, skillId), { info: "Skill removed." });
  await act("/profile/skills", () => setSkillClaim(getDb(), u, { skillId, level: str(f, "level"), note: str(f, "note") }), { info: "Skills updated." });
}
