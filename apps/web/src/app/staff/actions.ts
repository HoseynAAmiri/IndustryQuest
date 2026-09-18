"use server";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { reviewProject, verifyOrg } from "@/server/projects";

export async function review(form: FormData) {
  const user = await requireUser();
  const projectId = String(form.get("projectId"));
  const approve = form.get("decision") === "approve";
  await act(`/staff/projects/${projectId}`,
    () => reviewProject(getDb(), user, { projectId, approve, note: String(form.get("note") ?? "") }),
    { to: "/staff", info: approve ? "Brief published." : "Sent back to the owner." });
}

export async function verify(form: FormData) {
  const user = await requireUser();
  await act("/staff", () => verifyOrg(getDb(), user, String(form.get("orgId"))), { info: "Organization verified." });
}
