"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { toggleSaved } from "@/server/discovery";

export async function toggleSave(form: FormData) {
  const user = await requireUser();
  const back = String(form.get("back") ?? "/explore");
  // Only follow same-site paths back.
  await act(back.startsWith("/") && !back.startsWith("//") ? back : "/explore", () => toggleSaved(getDb(), user, String(form.get("projectId"))));
}
