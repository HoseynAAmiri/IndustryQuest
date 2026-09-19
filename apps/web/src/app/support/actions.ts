"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { addCaseUpdate, openCase, resolveCase, takeCase, type CaseType, type Resolution } from "@/server/cases";
import { getDb } from "@/server/db";

const s = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function openCaseAction(f: FormData) {
  const u = await requireUser();
  const enrollmentId = s(f, "enrollmentId") || undefined;
  const back = enrollmentId ? `/workspace/${enrollmentId}` : "/support";
  await act(back, () => openCase(getDb(), u, {
    type: s(f, "type") as CaseType, enrollmentId, summary: s(f, "summary"), requestedDays: Number(s(f, "requestedDays")) || undefined,
  }), { to: "/support", info: "Request sent. Staff will reply within five days." });
}

export async function caseUpdateAction(f: FormData) {
  const u = await requireUser();
  const back = s(f, "back") === "staff" ? `/staff/cases/${s(f, "caseId")}` : "/support";
  await act(back, () => addCaseUpdate(getDb(), u, { caseId: s(f, "caseId"), body: s(f, "body") }), { info: "Update added." });
}

export async function takeCaseAction(f: FormData) {
  const u = await requireUser();
  await act(`/staff/cases/${s(f, "caseId")}`, () => takeCase(getDb(), u, s(f, "caseId")), { info: "Assigned to you." });
}

export async function resolveCaseAction(f: FormData) {
  const u = await requireUser();
  const kind = s(f, "action");
  const action: Resolution = kind === "extend" ? { kind, days: Number(s(f, "days")) || 7 }
    : kind === "replace_mentor" ? { kind, mentorId: s(f, "mentorId") }
    : kind === "reopen" || kind === "close" ? { kind } : { kind: "none" };
  await act(`/staff/cases/${s(f, "caseId")}`, () => resolveCase(getDb(), u, { caseId: s(f, "caseId"), resolution: s(f, "resolution"), action }),
    { to: "/staff/cases", info: "Case resolved and the reporter notified." });
}
