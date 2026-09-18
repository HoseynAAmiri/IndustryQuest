// PRD §10.4. Only Emerging and Bronze exist in the pilot.
export const TIERS = ["none", "emerging", "bronze"] as const;
export type Tier = (typeof TIERS)[number];
export const tierRank = (t: Tier) => TIERS.indexOf(t);

export type Evidence = { projectId: string; assessorId: string; score: number };

export function tierFor(evidence: Evidence[]): Tier {
  const ok = evidence.filter((e) => e.score >= 3);
  const projects = new Set(ok.map((e) => e.projectId));
  const assessors = new Set(ok.map((e) => e.assessorId));
  if (projects.size >= 2 && assessors.size >= 2) return "bronze";
  return ok.length ? "emerging" : "none";
}
