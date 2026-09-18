import { checkEligibility, type Prerequisite } from "./eligibility.ts";
import { tierRank, type Tier } from "./mastery.ts";

// PRD §11.1–11.2: explain fit in plain statements, never a match percentage.
// Ranking uses declared interests, weekly time and evidence only; no GPA or prestige.
export type FitStudent = { interests: string[]; weeklyHours: number; tiers: Record<string, Tier> };
export type FitProject = {
  text: string; // title + summary, for interest matching
  skills: { id: string; name: string }[];
  effortHours: number;
  beginner: boolean;
  prerequisites: Prerequisite[];
};

export function explainFit(s: FitStudent, p: FitProject) {
  const reasons: string[] = [];
  const hay = `${p.text} ${p.skills.map((k) => k.name).join(" ")}`.toLowerCase();
  const hits = s.interests.filter((i) => i.trim() && hay.includes(i.trim().toLowerCase()));
  if (hits.length) reasons.push(`Matches your interest in ${hits.slice(0, 2).join(" and ")}`);
  if (s.weeklyHours > 0) {
    const weeks = Math.ceil(p.effortHours / s.weeklyHours);
    if (weeks <= 3) reasons.push(`About ${weeks} ${weeks === 1 ? "week" : "weeks"} at your ${s.weeklyHours} hours a week`);
  }
  const next = p.skills.find((k) => tierRank(s.tiers[k.id] ?? "none") < tierRank("bronze"));
  if (next) reasons.push(`Adds evidence for ${next.name}`);
  if (p.beginner && !Object.keys(s.tiers).length) reasons.push("Open to students with no verified work yet");
  const { eligible } = checkEligibility(p.prerequisites, s.tiers);
  return { eligible, reasons, score: eligible ? hits.length * 3 + reasons.length : -1 };
}
