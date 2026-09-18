// PRD §12.1: scores 1–4. Every critical criterion must meet its threshold; a high average cannot
// compensate. Not-applicable needs a reason and is excluded, never counted as zero.
export type Criterion = {
  id: string;
  name: string;
  description: string;
  critical: boolean;
  threshold: number;
  skillId?: string;
};
export type Score = { criterionId: string; score: number | null; naReason?: string; comment?: string };

export function evaluate(rubric: Criterion[], scores: Score[]) {
  const errors: string[] = [];
  const failing: string[] = [];
  for (const c of rubric) {
    const s = scores.find((x) => x.criterionId === c.id);
    if (!s) errors.push(`${c.name}: missing score`);
    else if (s.score === null) {
      if (!s.naReason?.trim()) errors.push(`${c.name}: give a reason for not applicable`);
    } else if (!Number.isInteger(s.score) || s.score < 1 || s.score > 4) errors.push(`${c.name}: score must be 1 to 4`);
    else if (c.critical && s.score < c.threshold) failing.push(c.name);
  }
  return { valid: errors.length === 0, errors, failing, pass: errors.length === 0 && failing.length === 0 };
}

// Lowest score per mapped skill. A skill only gets evidence from criteria that map to it (§10.4).
export function skillScores(rubric: Criterion[], scores: Score[]) {
  const out = new Map<string, number>();
  for (const c of rubric) {
    const s = scores.find((x) => x.criterionId === c.id)?.score;
    if (!c.skillId || s == null) continue;
    out.set(c.skillId, Math.min(out.get(c.skillId) ?? 4, s));
  }
  return out;
}
