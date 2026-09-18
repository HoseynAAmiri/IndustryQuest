"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { setCredentialPublic } from "@/server/credentials";
import { getDb } from "@/server/db";

export async function shareAction(f: FormData) {
  const u = await requireUser();
  const isPublic = f.get("public") === "1";
  await act("/profile#credentials", () => setCredentialPublic(getDb(), u, { credentialId: String(f.get("credentialId")), isPublic }),
    { info: isPublic ? "Public link turned on. Anyone with the link can verify it." : "Public link turned off. The old link stops working now." });
}
