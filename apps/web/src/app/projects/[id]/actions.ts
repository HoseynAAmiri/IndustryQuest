"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { apply } from "@/server/enrollments";

export async function applyAction(form: FormData) {
  const user = await requireUser();
  const projectId = String(form.get("projectId"));
  await act(`/projects/${projectId}/apply`, () => apply(getDb(), user, {
    projectId, motivation: String(form.get("motivation") ?? ""), availability: String(form.get("availability") ?? ""),
  }), { to: "/quests", info: "Application sent. The company will reply here." });
}
