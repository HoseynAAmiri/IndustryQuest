"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { reviewProject } from "@/server/projects";
import { correctCredentialSummary, grantEquivalency, grantException, revokeCredential, verifyMentor, verifyOrgWithNote } from "@/server/staff";

export async function review(form: FormData) {
  const user = await requireUser();
  const projectId = String(form.get("projectId"));
  const approve = form.get("decision") === "approve";
  await act(`/staff/projects/${projectId}`,
    () => reviewProject(getDb(), user, { projectId, approve, note: String(form.get("note") ?? "") }),
    { to: "/staff", info: approve ? "Brief published." : "Sent back to the owner." });
}

const s = (f: FormData, k: string) => String(f.get(k) ?? "");

export async function verify(form: FormData) {
  const user = await requireUser();
  await act("/staff", () => verifyOrgWithNote(getDb(), user, { orgId: s(form, "orgId"), note: s(form, "note") }), { info: "Organization verified." });
}

export async function verifyMentorAction(form: FormData) {
  const user = await requireUser();
  await act("/staff", () => verifyMentor(getDb(), user, { userId: s(form, "userId"), note: s(form, "note") }), { info: "Mentor verified." });
}

const studentPage = (f: FormData) => `/staff/students/${s(f, "userId")}`;

export async function exceptionAction(form: FormData) {
  const user = await requireUser();
  await act(studentPage(form), () => grantException(getDb(), user, { userId: s(form, "userId"), slots: Number(s(form, "slots")), reason: s(form, "reason") }), { info: "Exception recorded." });
}

export async function equivalencyAction(form: FormData) {
  const user = await requireUser();
  await act(studentPage(form), () => grantEquivalency(getDb(), user, { userId: s(form, "userId"), skillId: s(form, "skillId"), evidence: s(form, "evidence") }), { info: "Equivalency recorded. No credential was issued." });
}

export async function revokeAction(form: FormData) {
  const user = await requireUser();
  await act(studentPage(form), () => revokeCredential(getDb(), user, { credentialId: s(form, "credentialId"), reason: s(form, "reason") }), { info: "Credential revoked; XP and skills updated." });
}

export async function correctAction(form: FormData) {
  const user = await requireUser();
  await act(studentPage(form), () => correctCredentialSummary(getDb(), user, { credentialId: s(form, "credentialId"), summary: s(form, "summary"), reason: s(form, "reason") }), { info: "Credential corrected." });
}
