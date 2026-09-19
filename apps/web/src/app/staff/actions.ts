"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { reviewProject } from "@/server/projects";
import { correctCredentialSummary, grantEquivalency, grantException, revokeCredential, saveRubricTemplate, saveSkill, setHoliday, setOrgSuspension, undoOrgVerification, verifyMentor, verifyOrgWithNote } from "@/server/staff";

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
  await act("/staff", () => verifyOrgWithNote(getDb(), user, { orgId: s(form, "orgId"), note: s(form, "note") }), {
    info: "Organization verified.", params: (result) => ({ undoOrg: result.orgId, undoEvent: result.eventId }),
  });
}

export async function undoVerification(form: FormData) {
  const user = await requireUser();
  await act("/staff", () => undoOrgVerification(getDb(), user, { orgId: s(form, "orgId"), eventId: s(form, "eventId") }),
    { info: "Organization verification undone." });
}

export async function suspensionAction(form: FormData) {
  const user = await requireUser();
  const suspend = s(form, "action") === "suspend";
  await act("/staff", () => setOrgSuspension(getDb(), user, { orgId: s(form, "orgId"), suspend, reason: s(form, "reason") }),
    { info: suspend ? "Organization suspended. Live listings were paused." : "Organization participation restored." });
}

export async function skillCatalogAction(form: FormData) {
  const user = await requireUser();
  await act("/staff/catalog", () => saveSkill(getDb(), user, { id: s(form, "id"), name: s(form, "name"), aliases: s(form, "aliases"), active: form.get("active") === "on" }),
    { info: "Skill catalog version saved." });
}

export async function rubricTemplateAction(form: FormData) {
  const user = await requireUser();
  await act("/staff/catalog", () => saveRubricTemplate(getDb(), user, { name: s(form, "name"), criterion: s(form, "criterion"), description: s(form, "description"), threshold: Number(s(form, "threshold")), skillId: s(form, "skillId") === "none" ? undefined : s(form, "skillId") || undefined }),
    { info: "New rubric template version saved." });
}

export async function holidayAction(form: FormData) {
  const user = await requireUser();
  await act("/staff/catalog", () => setHoliday(getDb(), user, { day: s(form, "day"), name: s(form, "intent") === "remove" ? undefined : s(form, "name") }),
    { info: s(form, "intent") === "remove" ? "Holiday removed." : "Holiday saved. Overdue rules now skip it." });
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
