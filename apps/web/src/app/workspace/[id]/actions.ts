"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { respondToScopeChange } from "@/server/enrollments";
import { openCase, type CaseType } from "@/server/cases";
import { addLink, postMessage, saveSubmissionDraft, submit, toggleMilestone } from "@/server/workspace";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");
const at = (f: FormData, tab: string) => `/workspace/${s(f, "enrollmentId")}${tab && `?tab=${tab}`}`;

export async function messageAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "discussion"), () => postMessage(getDb(), u, {
    enrollmentId: s(f, "enrollmentId"), body: s(f, "body"), isQuestion: f.get("isQuestion") === "on", fileId: s(f, "fileId") === "none" ? undefined : s(f, "fileId") || undefined,
  }));
}

export async function milestoneAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, ""), () => toggleMilestone(getDb(), u, s(f, "milestoneId")));
}

export async function linkAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "files"), () => addLink(getDb(), u, { enrollmentId: s(f, "enrollmentId"), name: s(f, "name"), url: s(f, "url"), description: s(f, "description") }), { info: "Link added." });
}

export async function submitAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "submissions"), () => submit(getDb(), u, {
    enrollmentId: s(f, "enrollmentId"), clientKey: s(f, "clientKey"), fileIds: f.getAll("fileIds").map(String),
    contributionStatement: s(f, "contribution"), reflection: s(f, "reflection"),
  }), { to: at(f, ""), info: "Submitted. Your mentor has been asked to review it within five business days." });
}

export async function scopeAction(f: FormData) {
  const u = await requireUser();
  const accept = f.get("decision") === "accept";
  await act(at(f, ""), () => respondToScopeChange(getDb(), u, { enrollmentId: s(f, "enrollmentId"), accept }),
    { info: accept ? "You're now on the new brief version." : "You kept your original agreement. The company has been told." });
}

export async function draftAction(f: FormData) {
  const u = await requireUser();
  await act(at(f, "submissions"), () => saveSubmissionDraft(getDb(), u, { enrollmentId: s(f, "enrollmentId"), contribution: s(f, "contribution"), reflection: s(f, "reflection") }),
    { info: "Draft saved. Only you can see it." });
}

export async function feedbackAction(f: FormData) {
  const u = await requireUser();
  const enrollmentId = s(f, "enrollmentId");
  const type = s(f, "type") as Extract<CaseType, "mentor_feedback" | "project_feedback">;
  const labels = type === "mentor_feedback" ? ["Clarity", "Responsiveness", "Usefulness", "Respect"] : ["Scope", "Resources", "Learning value", "Mentor support"];
  const values = labels.map((_, i) => Number(s(f, `rating${i}`)));
  const ratings = labels.map((label, i) => `${label}: ${values[i]}/5`);
  await act(`/workspace/${enrollmentId}`, () => {
    if (values.some((n) => !Number.isInteger(n) || n < 1 || n > 5)) throw new UserError("Rate each item from 1 to 5.");
    return openCase(getDb(), u, { type, enrollmentId, summary: `${ratings.join("\n")}\n\n${s(f, "comment") || "No additional comment."}` });
  }, { info: "Private feedback sent to program staff." });
}
