"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { respondToOffer, withdraw } from "@/server/enrollments";

export async function respond(form: FormData) {
  const user = await requireUser();
  const enrollmentId = String(form.get("enrollmentId"));
  const accept = form.get("decision") === "accept";
  await act("/quests", () => respondToOffer(getDb(), user, { enrollmentId, accept, agreed: form.get("agreed") === "on" }), {
    to: accept ? `/workspace/${enrollmentId}` : "/quests",
    info: accept ? "You're in. Start with the first milestone and say hello to your mentor." : "Offer declined. Nothing changes on your profile.",
  });
}

export async function withdrawAction(form: FormData) {
  const user = await requireUser();
  await act("/quests", () => withdraw(getDb(), user, String(form.get("enrollmentId"))), { info: "Withdrawn. Your work stays saved and nothing negative goes on your profile." });
}
