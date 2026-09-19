import { z } from "zod";
import { TIER_XP } from "./levels.ts";

// Brief content as stored on an immutable brief version. Drafts may be incomplete;
// canPublish lists what still blocks publication (PRD §9.1, PRJ-03/05/07, AC-02).
export const criterionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  critical: z.boolean(),
  threshold: z.number().int().min(1).max(4),
  skillId: z.string().optional(),
});

export const briefSchema = z.object({
  title: z.string().max(120),
  summary: z.string().max(2000),
  problem: z.string().max(4000),
  tier: z.enum(Object.keys(TIER_XP) as ["Q1", "Q2"]),
  beginner: z.boolean(),
  effortHours: z.number().int().min(0).max(200),
  capacity: z.number().int().min(0).max(50),
  mentorId: z.string(),
  backupContact: z.string().max(200),
  compensation: z.enum(["", "paid", "stipend", "unpaid", "course"]),
  compensationDetails: z.string().max(500),
  applyDeadline: z.string(), // YYYY-MM-DD, "" while drafting
  deliverables: z.array(z.string().min(1)).max(10),
  milestones: z.array(z.object({ title: z.string().min(1), dueInDays: z.number().int().min(1).max(365) })).max(10),
  resources: z.string().max(4000),
  terms: z.string().max(4000),
  skillIds: z.array(z.string()).max(10),
  prerequisites: z.array(z.object({ skillId: z.string(), minTier: z.enum(["emerging", "bronze"]) })).max(5),
  rubric: z.array(criterionSchema).max(10),
  // Added after the first release; defaults keep older briefs valid.
  discipline: z.string().max(80).default(""),
  mentorHours: z.number().int().min(0).max(100).default(0), // mentor review commitment per student (PRJ-04)
  selectionMethod: z.enum(["", "first_come", "rubric", "lottery", "other"]).default(""),
  selectionDetails: z.string().max(500).default(""),
  expenses: z.string().max(500).default(""), // PRJ-05
  paymentProcess: z.string().max(500).default(""), // PAY-02: who pays and how, outside the platform
  software: z.string().max(1000).default(""), // PRJ-06
  startingKnowledge: z.string().max(1000).default(""),
  portfolioRules: z.string().max(1000).default(""),
  confidentialNotes: z.string().max(2000).default(""), // PRJ-09: enrolled students only
});
export const SELECTION = {
  first_come: "First eligible applicants", rubric: "Scored against the published criteria", lottery: "Lottery among eligible applicants", other: "Other (see details)",
} as const;
export type Brief = z.infer<typeof briefSchema>;

export function canPublish(b: Brief, org: { verified: boolean; mentorConfirmed?: boolean }, today = new Date().toISOString().slice(0, 10)) {
  const e: string[] = [];
  if (!org.verified) e.push("Your organization has not been verified by staff yet.");
  if (b.title.trim().length < 3) e.push("Add a title.");
  if (b.summary.trim().length < 20) e.push("Write a public summary of at least 20 characters.");
  if (!b.problem.trim()) e.push("Describe the real problem the project addresses.");
  if (!b.mentorId) e.push("Name a mentor who has agreed to support this project.");
  else if (org.mentorConfirmed === false) e.push("Wait for the mentor to confirm they'll support this project.");
  if (b.mentorId && b.mentorHours < 1) e.push("State how many hours the mentor will give each student.");
  if (!b.backupContact.trim()) e.push("Add a backup escalation contact.");
  if (!b.compensation) e.push("State the compensation terms, including unpaid if it is unpaid.");
  if (b.compensation === "paid" || b.compensation === "stipend")
    if (!b.compensationDetails.trim()) e.push("Give the compensation amount and conditions.");
  if ((b.compensation === "paid" || b.compensation === "stipend") && !b.paymentProcess.trim())
    e.push("Say who pays and through which process.");
  if (!b.selectionMethod) e.push("Say how you'll choose between applicants.");
  if (b.effortHours < 1) e.push("Estimate the student effort in hours.");
  if (b.capacity < 1) e.push("Offer at least one place.");
  if (!b.applyDeadline || b.applyDeadline < today) e.push("Set an application deadline in the future.");
  if (!b.deliverables.length) e.push("List at least one deliverable.");
  if (!b.milestones.length) e.push("Add at least one milestone.");
  if (!b.terms.trim()) e.push("State the participation, confidentiality and portfolio terms.");
  if (!b.rubric.length) e.push("Publish an assessment rubric.");
  else if (!b.rubric.some((c) => c.critical)) e.push("Mark at least one rubric criterion as required to pass.");
  for (const s of b.skillIds)
    if (!b.rubric.some((c) => c.skillId === s)) e.push("Every target skill needs a rubric criterion that assesses it.");
  return [...new Set(e)];
}

// PRD §13.1, PRJ-10/15: what a new version changes, in words a student can consent to.
const LABELS: [keyof Brief, string][] = [
  ["title", "Title"], ["deliverables", "Deliverables"], ["milestones", "Milestones"], ["effortHours", "Effort"],
  ["rubric", "Assessment rubric"], ["compensation", "Compensation"], ["compensationDetails", "Compensation details"],
  ["expenses", "Expenses"], ["terms", "Terms"], ["resources", "Resources"], ["software", "Software"], ["mentorId", "Mentor"],
  ["mentorHours", "Mentor time"], ["portfolioRules", "Portfolio rules"],
];

export function briefDiff(before: Brief, after: Brief) {
  return LABELS.filter(([k]) => JSON.stringify(before[k]) !== JSON.stringify(after[k])).map(([, label]) => label);
}
