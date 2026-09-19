"use server";
import { briefSchema, type Brief } from "@iq/core";
import { NONE } from "@/components/ui";
import { act } from "@/server/action";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { makeOffer, reject } from "@/server/enrollments";
import { confirmMentoring, reviseBrief, saveDraft, setListingState, submitForReview } from "@/server/projects";

const ROWS = 5;
const s = (f: FormData, k: string) => {
  const v = String(f.get(k) ?? "").trim();
  return v === NONE ? "" : v;
};
const lines = (v: string) => v.split("\n").map((l) => l.trim()).filter(Boolean);

function parseBrief(f: FormData): Brief {
  const rows = Array.from({ length: ROWS }, (_, i) => i);
  const parsed = briefSchema.safeParse({
    title: s(f, "title"), summary: s(f, "summary"), problem: s(f, "problem"),
    tier: s(f, "tier"), beginner: f.get("beginner") === "on",
    effortHours: Number(s(f, "effortHours")) || 0, capacity: Number(s(f, "capacity")) || 0,
    mentorId: s(f, "mentorId"), backupContact: s(f, "backupContact"),
    compensation: s(f, "compensation"), compensationDetails: s(f, "compensationDetails"),
    applyDeadline: s(f, "applyDeadline"),
    deliverables: lines(s(f, "deliverables")),
    milestones: rows.filter((i) => s(f, `m${i}.title`))
      .map((i) => ({ title: s(f, `m${i}.title`), dueInDays: Number(s(f, `m${i}.days`)) || 7 })),
    resources: s(f, "resources"), terms: s(f, "terms"),
    skillIds: f.getAll("skillIds").map(String),
    prerequisites: rows.filter((i) => s(f, `p${i}.skill`))
      .map((i) => ({ skillId: s(f, `p${i}.skill`), minTier: s(f, `p${i}.tier`) || "emerging" })),
    rubric: rows.filter((i) => s(f, `r${i}.name`)).map((i) => ({
      id: `c${i + 1}`, name: s(f, `r${i}.name`), description: s(f, `r${i}.description`),
      critical: f.get(`r${i}.critical`) === "on", threshold: Number(s(f, `r${i}.threshold`)) || 3,
      skillId: s(f, `r${i}.skill`) || undefined,
    })),
    discipline: s(f, "discipline"), mentorHours: Number(s(f, "mentorHours")) || 0,
    selectionMethod: s(f, "selectionMethod"), selectionDetails: s(f, "selectionDetails"),
    expenses: s(f, "expenses"), paymentProcess: s(f, "paymentProcess"), software: s(f, "software"),
    startingKnowledge: s(f, "startingKnowledge"), portfolioRules: s(f, "portfolioRules"), confidentialNotes: s(f, "confidentialNotes"),
  });
  if (!parsed.success) throw new UserError(`Check the form: ${parsed.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`);
  return parsed.data;
}

export async function saveBrief(form: FormData) {
  const user = await requireUser();
  const projectId = s(form, "projectId") || undefined;
  const orgId = s(form, "orgId");
  const submit = form.get("intent") === "submit";
  let id = projectId;
  const back = () => (id ? `/company/projects/${id}` : `/company/projects/new?org=${orgId}`);
  await act(back, async () => {
    id = await saveDraft(getDb(), user, { projectId, orgId, brief: parseBrief(form) });
    if (submit) await submitForReview(getDb(), user, id);
  }, { to: back, info: submit ? "Submitted for staff review." : "Draft saved." });
}

export async function offerAction(form: FormData) {
  const user = await requireUser();
  const back = `/company/projects/${s(form, "projectId")}#applicants`;
  await act(back, () => makeOffer(getDb(), user, { enrollmentId: s(form, "enrollmentId") }), { info: "Offer sent. It holds a place for 5 days." });
}

export async function rejectAction(form: FormData) {
  const user = await requireUser();
  const back = `/company/projects/${s(form, "projectId")}#applicants`;
  await act(back, () => reject(getDb(), user, { enrollmentId: s(form, "enrollmentId"), note: s(form, "note") }), { info: "Applicant notified. Nothing negative appears on their profile." });
}

export async function reviseAction(form: FormData) {
  const user = await requireUser();
  const projectId = s(form, "projectId");
  await act(`/company/projects/${projectId}?edit=1`, async () => {
    await reviseBrief(getDb(), user, { projectId, brief: parseBrief(form), reason: s(form, "reason"), material: form.get("material") === "on" });
  }, { to: `/company/projects/${projectId}`, info: form.get("material") === "on"
    ? "New version published. Enrolled students were asked to agree to the change." : "New version published for new applicants." });
}

export async function listingAction(form: FormData) {
  const user = await requireUser();
  const projectId = s(form, "projectId");
  const action = s(form, "action") as "pause" | "resume" | "close";
  await act(`/company/projects/${projectId}`, () => setListingState(getDb(), user, { projectId, action, reason: s(form, "reason") }),
    { info: { pause: "Applications paused. Applicants were told why.", resume: "Applications reopened.", close: "Listing closed. Current students carry on." }[action] });
}

export async function confirmMentoringAction(form: FormData) {
  const user = await requireUser();
  await act("/mentor", () => confirmMentoring(getDb(), user, s(form, "projectId")), { info: "Thanks. The company can now submit the brief." });
}
