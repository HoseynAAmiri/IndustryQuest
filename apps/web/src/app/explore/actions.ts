"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { toggleSaved } from "@/server/discovery";
import { toggleDismissed } from "@/server/profile";

export async function toggleSave(form: FormData) {
  const user = await requireUser();
  const back = String(form.get("back") ?? "/explore");
  // Only follow same-site paths back.
  await act(back.startsWith("/") && !back.startsWith("//") ? back : "/explore", () => toggleSaved(getDb(), user, String(form.get("projectId"))));
}

export async function dismissAction(form: FormData) {
  const user = await requireUser();
  await act("/", () => toggleDismissed(getDb(), user, String(form.get("projectId"))), { info: "Hidden from your recommendations. It's still in Explore." });
}
