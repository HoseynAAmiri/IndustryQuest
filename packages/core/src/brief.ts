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
});
export type Brief = z.infer<typeof briefSchema>;

export function canPublish(b: Brief, org: { verified: boolean }, today = new Date().toISOString().slice(0, 10)) {
  const e: string[] = [];
  if (!org.verified) e.push("Your organization has not been verified by staff yet.");
  if (b.title.trim().length < 3) e.push("Add a title.");
  if (b.summary.trim().length < 20) e.push("Write a public summary of at least 20 characters.");
  if (!b.problem.trim()) e.push("Describe the real problem the project addresses.");
  if (!b.mentorId) e.push("Name a mentor who has agreed to support this project.");
  if (!b.backupContact.trim()) e.push("Add a backup escalation contact.");
  if (!b.compensation) e.push("State the compensation terms, including unpaid if it is unpaid.");
  if (b.compensation === "paid" || b.compensation === "stipend")
    if (!b.compensationDetails.trim()) e.push("Give the compensation amount and conditions.");
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
