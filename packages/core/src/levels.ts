// PRD §10.3: XP to reach level L = 125 × (L − 1) × L. §9.3 sets XP per quest tier.
export const TIER_XP = { Q1: 120, Q2: 250 } as const;
export type QuestTier = keyof typeof TIER_XP;

export const xpForLevel = (level: number) => 125 * (level - 1) * level;

export function levelFromXp(xp: number) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  return level;
}

export function progress(xp: number) {
  const level = levelFromXp(xp);
  return { xp, level, levelStart: xpForLevel(level), nextLevelAt: xpForLevel(level + 1) };
}
