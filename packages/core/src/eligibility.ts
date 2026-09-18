import { tierRank, type Tier } from "./mastery.ts";

// PRD §10.6, AC-12: only skill evidence decides eligibility. XP is deliberately not an input.
export type Prerequisite = { skillId: string; minTier: Exclude<Tier, "none"> };

export function checkEligibility(prereqs: Prerequisite[], tiers: Record<string, Tier>) {
  const missing = prereqs
    .map((p) => ({ ...p, have: tiers[p.skillId] ?? ("none" as Tier) }))
    .filter((p) => tierRank(p.have) < tierRank(p.minTier));
  return { eligible: missing.length === 0, missing };
}
