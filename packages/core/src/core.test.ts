import { expect, test } from "vitest";
import {
  canPublish, checkEligibility, evaluate, explainFit, levelFromXp, nextEnrollment, nextListing, progress,
  skillScores, tierFor, xpForLevel, type Brief, type Criterion,
} from "./index.ts";

test("level curve matches PRD §10.3", () => {
  expect([1, 2, 3, 4, 5, 6].map(xpForLevel)).toEqual([0, 250, 750, 1500, 2500, 3750]);
  expect([0, 120, 249, 250, 749, 750, 3750].map(levelFromXp)).toEqual([1, 1, 1, 2, 2, 3, 6]);
  expect(progress(120)).toEqual({ xp: 120, level: 1, levelStart: 0, nextLevelAt: 250 }); // §10.8
});

test("transitions allow the core loop and reject everything else", () => {
  let s = nextEnrollment("applied", "offer");
  s = nextEnrollment(s, "acceptOffer");
  s = nextEnrollment(s, "submit");
  s = nextEnrollment(s, "requestRevision");
  s = nextEnrollment(s, "submit");
  expect(nextEnrollment(s, "complete")).toBe("completed");
  expect(() => nextEnrollment("completed", "complete")).toThrow();
  expect(() => nextEnrollment("applied", "acceptOffer")).toThrow();
  expect(() => nextListing("draft", "approve")).toThrow();
  expect(nextListing(nextListing("draft", "submitForReview"), "approve")).toBe("published");
});

const rubric: Criterion[] = [
  { id: "a", name: "Signal analysis", description: "", critical: true, threshold: 3, skillId: "sig" },
  { id: "b", name: "Communication", description: "", critical: false, threshold: 3 },
  { id: "c", name: "Code", description: "", critical: true, threshold: 3, skillId: "py" },
];

test("a failed critical criterion fails even with a high average", () => {
  const r = evaluate(rubric, [
    { criterionId: "a", score: 2 }, { criterionId: "b", score: 4 }, { criterionId: "c", score: 4 },
  ]);
  expect(r).toMatchObject({ valid: true, pass: false, failing: ["Signal analysis"] });
});

test("N/A needs a reason and is excluded from skill evidence", () => {
  expect(evaluate(rubric, [{ criterionId: "a", score: 3 }, { criterionId: "b", score: null }, { criterionId: "c", score: 3 }]).valid).toBe(false);
  const scores = [{ criterionId: "a", score: 3 }, { criterionId: "b", score: 1 }, { criterionId: "c", score: null, naReason: "no code" }];
  expect(evaluate(rubric, scores).pass).toBe(true);
  expect([...skillScores(rubric, scores)]).toEqual([["sig", 3]]);
});

test("mastery tiers follow §10.4", () => {
  expect(tierFor([])).toBe("none");
  expect(tierFor([{ projectId: "p1", assessorId: "m1", score: 2 }])).toBe("none");
  expect(tierFor([{ projectId: "p1", assessorId: "m1", score: 3 }])).toBe("emerging");
  expect(tierFor([{ projectId: "p1", assessorId: "m1", score: 3 }, { projectId: "p2", assessorId: "m1", score: 4 }])).toBe("emerging");
  expect(tierFor([{ projectId: "p1", assessorId: "m1", score: 3 }, { projectId: "p2", assessorId: "m2", score: 4 }])).toBe("bronze");
});

test("eligibility ignores XP and names the missing skill (AC-12)", () => {
  const prereqs = [{ skillId: "sig", minTier: "emerging" as const }];
  expect(checkEligibility(prereqs, {})).toEqual({ eligible: false, missing: [{ skillId: "sig", minTier: "emerging", have: "none" }] });
  expect(checkEligibility(prereqs, { sig: "bronze" }).eligible).toBe(true);
});

test("publishing is blocked without mentor, rubric or compensation (AC-02)", () => {
  const empty: Brief = {
    title: "Vibration", summary: "Find the dominant frequencies in a dataset.", problem: "Pumps fail.", tier: "Q1",
    beginner: true, effortHours: 4, capacity: 2, mentorId: "", backupContact: "ops@example.com", compensation: "",
    compensationDetails: "", applyDeadline: "2099-01-01", deliverables: ["Notebook"], milestones: [{ title: "Draft", dueInDays: 7 }],
    resources: "", terms: "Portfolio summary allowed.", skillIds: [], prerequisites: [], rubric: [],
  };
  const errors = canPublish(empty, { verified: true });
  expect(errors).toEqual([
    "Name a mentor who has agreed to support this project.",
    "State the compensation terms, including unpaid if it is unpaid.",
    "Publish an assessment rubric.",
  ]);
  expect(canPublish({ ...empty, mentorId: "m1", compensation: "unpaid", rubric }, { verified: true })).toEqual([]);
});

test("fit explains itself in words and puts ineligible projects last", () => {
  const student = { interests: ["Python", "vibration"], weeklyHours: 6, tiers: {} };
  const p = {
    text: "Find the dominant frequencies in pump vibration data", skills: [{ id: "sig", name: "Signal analysis" }],
    effortHours: 5, beginner: true, prerequisites: [],
  };
  expect(explainFit(student, p).reasons).toEqual([
    "Matches your interest in vibration",
    "About 1 week at your 6 hours a week",
    "Adds evidence for Signal analysis",
    "Open to students with no verified work yet",
  ]);
  const locked = explainFit(student, { ...p, prerequisites: [{ skillId: "sig", minTier: "emerging" as const }] });
  expect(locked).toMatchObject({ eligible: false, score: -1 });
});
