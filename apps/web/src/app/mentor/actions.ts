"use server";
import type { Score } from "@iq/core";
import { NONE } from "@/components/ui";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { updateMentorProfile } from "@/server/profile";
import { assess, type Decision } from "@/server/review";

export async function assessAction(f: FormData) {
  const u = await requireUser();
  const submissionId = String(f.get("submissionId"));
  const ids = f.getAll("criterionId").map(String);
  const scores: Score[] = ids.map((id) => {
    const v = String(f.get(`score.${id}`) ?? "");
    return v === "na" || v === NONE || v === ""
      ? { criterionId: id, score: v === "na" ? null : NaN, naReason: String(f.get(`na.${id}`) ?? "") }
      : { criterionId: id, score: Number(v), comment: String(f.get(`comment.${id}`) ?? "") };
  });
  const decision = String(f.get("decision")) as Decision;
  await act(`/mentor/review/${submissionId}`, () => assess(getDb(), u, {
    submissionId, scores, decision, comment: String(f.get("comment") ?? ""), revisionDays: Number(f.get("revisionDays")) || 7,
  }), { to: "/mentor", info: { accept: "Accepted. The student's XP and credentials are issued.", revise: "Revision requested.", not_complete: "Closed as not completed. The student can appeal." }[decision] });
}

export async function mentorProfileAction(f: FormData) {
  const u = await requireUser();
  await act("/mentor", () => updateMentorProfile(getDb(), u, {
    headline: String(f.get("headline") ?? ""), expertise: String(f.get("expertise") ?? ""), capacity: Number(f.get("capacity")), timezone: String(f.get("timezone") ?? "UTC"),
  }), { info: "Mentor profile saved." });
}
