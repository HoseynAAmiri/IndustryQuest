// Dev-only demo data. Every organization and person here is fictional (PRD §25.3).
// Wipes all tables first. All accounts use the password "demo-password".
import { sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { TIER_XP, briefSchema, type Brief } from "@iq/core";
import { account, briefVersions, connect, memberships, organizations, projects, skills, studentProfiles, user } from "./index.ts";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
const db = connect(process.env.DATABASE_URL!);

await db.execute(sql`truncate table "user", organizations, skills restart identity cascade`);

await db.insert(skills).values([
  { id: "signal-analysis", name: "Signal analysis" },
  { id: "python-data", name: "Python for data work" },
  { id: "technical-writing", name: "Technical writing" },
  { id: "data-cleaning", name: "Data cleaning" },
]);

const password = await hashPassword("demo-password");
const people = [
  { id: "u-staff", name: "Sam Staff", email: "staff@demo.test", isStaff: true },
  { id: "u-owner", name: "Olive Owner", email: "owner@demo.test" },
  { id: "u-mentor", name: "Mina Mentor", email: "mentor@demo.test" },
  { id: "u-mentor2", name: "Theo Mentor", email: "mentor2@demo.test" },
  { id: "u-student", name: "Ada Student", email: "student@demo.test" },
];
await db.insert(user).values(people.map((p) => ({ ...p, emailVerified: true })));
await db.insert(account).values(people.map((p) => ({ id: `a-${p.id}`, accountId: p.id, providerId: "credential", userId: p.id, password })));
await db.insert(studentProfiles).values({
  userId: "u-student", interests: ["vibration analysis", "Python"], goals: "Get hands-on with real sensor data.", weeklyHours: 6, timezone: "Europe/London",
});

const [org] = await db.insert(organizations).values({
  name: "Northwind Pumps (fictional)",
  description: "A made-up pump manufacturer used for demos. Not a real company.",
  verifiedAt: new Date(), verifiedBy: "u-staff",
}).returning();
await db.insert(memberships).values([
  { userId: "u-owner", orgId: org.id, role: "owner" },
  { userId: "u-mentor", orgId: org.id, role: "mentor" },
  { userId: "u-mentor2", orgId: org.id, role: "mentor" },
]);

const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const base: Omit<Brief, "title" | "summary" | "problem" | "tier" | "mentorId" | "rubric"> = {
  beginner: true, effortHours: 5, capacity: 3, backupContact: "Sam Staff, staff@demo.test",
  compensation: "unpaid", compensationDetails: "", applyDeadline: inDays(60),
  deliverables: [], milestones: [], resources: "", terms: "", skillIds: [], prerequisites: [],
};

async function project(state: "published" | "in_review", b: Brief) {
  const brief = briefSchema.parse(b);
  const [p] = await db.insert(projects).values({ orgId: org.id, ownerId: "u-owner", state }).returning();
  const [v] = await db.insert(briefVersions).values({
    projectId: p.id, version: 1, title: brief.title, summary: brief.summary, tier: brief.tier, beginner: brief.beginner,
    capacity: brief.capacity, xp: TIER_XP[brief.tier], mentorId: brief.mentorId || null, content: brief, createdBy: "u-owner",
  }).returning();
  await db.update(projects).set({ currentVersionId: v.id }).where(sql`id = ${p.id}`);
}

await project("published", {
  ...base,
  title: "Find the dominant frequencies in pump vibration data",
  summary: "Analyse a week of accelerometer readings from one pump and report which frequencies dominate and what they suggest.",
  problem: "Maintenance staff want to know whether the vibration spectrum shows early bearing wear.",
  tier: "Q1", mentorId: "u-mentor",
  deliverables: ["A reproducible notebook", "A one-page summary of findings and their limits"],
  milestones: [{ title: "Plot the raw signal and a first spectrum", dueInDays: 4 }, { title: "Final notebook and summary", dueInDays: 10 }],
  resources: "CSV of 3-axis accelerometer data sampled at 1 kHz (fictional). Worked FFT example notebook.",
  terms: "Unpaid learning project. The dataset stays private. You may publish the approved summary in your portfolio.",
  skillIds: ["signal-analysis", "python-data"],
  rubric: [
    { id: "c1", name: "Signal analysis", description: "Correct spectrum, sensible windowing, peaks identified and explained.", critical: true, threshold: 3, skillId: "signal-analysis" },
    { id: "c2", name: "Reproducible code", description: "Notebook runs top to bottom on the provided data.", critical: true, threshold: 3, skillId: "python-data" },
    { id: "c3", name: "Communication", description: "Summary states findings and limits in plain language.", critical: false, threshold: 3 },
  ],
});

await project("published", {
  ...base,
  title: "Compare two fault-detection methods on bearing data",
  summary: "Apply envelope analysis and a simple spectral-kurtosis check to labelled bearing data, then recommend one.",
  problem: "The team needs to pick a fault-detection method for its monitoring dashboard.",
  tier: "Q2", beginner: false, effortHours: 12, capacity: 2, mentorId: "u-mentor2",
  deliverables: ["Notebook comparing both methods", "A recommendation memo"],
  milestones: [{ title: "Method plan agreed with mentor", dueInDays: 5 }, { title: "Comparison and memo", dueInDays: 20 }],
  resources: "Labelled bearing dataset (fictional).",
  terms: "Unpaid learning project. Portfolio summary allowed after company approval.",
  skillIds: ["signal-analysis"],
  prerequisites: [{ skillId: "signal-analysis", minTier: "emerging" }],
  rubric: [
    { id: "c1", name: "Method comparison", description: "Both methods applied correctly and compared on the same data.", critical: true, threshold: 3, skillId: "signal-analysis" },
    { id: "c2", name: "Recommendation", description: "Clear choice with trade-offs.", critical: true, threshold: 3, skillId: "technical-writing" },
  ],
});

await project("in_review", {
  ...base,
  title: "Clean a year of maintenance logs",
  summary: "Tidy a messy export of maintenance tickets and document every quality issue you find.",
  problem: "Ticket data is too inconsistent to report on.",
  tier: "Q1", mentorId: "u-mentor",
  deliverables: ["Cleaned CSV", "Data quality notes"],
  milestones: [{ title: "Cleaned data and notes", dueInDays: 7 }],
  terms: "Unpaid learning project.",
  skillIds: ["data-cleaning"],
  rubric: [{ id: "c1", name: "Data cleaning", description: "Issues found, fixed and documented.", critical: true, threshold: 3, skillId: "data-cleaning" }],
});

console.log("Seeded. Sign in as student@, owner@, mentor@, mentor2@ or staff@demo.test with password demo-password");
await db.pool.end();
