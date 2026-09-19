// Dev/demo data. Every organization, person and result here is fictional (PRD §25.3).
// Wipes all tables first, then builds a world where every feature has something to show.
import { eq, sql } from "drizzle-orm";
import { hashPassword } from "better-auth/crypto";
import { TIER_XP, briefSchema, type Brief, type Criterion } from "@iq/core";
import {
  DEMO_PASSWORD, DEMO_PERSONAS, account, briefVersions, connect, memberships, organizations, projects, skillClaims, skills, studentProfiles, user,
} from "./index.ts";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
const db = connect(process.env.DATABASE_URL!);
await db.execute(sql`truncate table "user", organizations, skills, events restart identity cascade`);

// ── Skills ──
await db.insert(skills).values([
  { id: "signal-analysis", name: "Signal analysis" },
  { id: "python-data", name: "Python for data work" },
  { id: "technical-writing", name: "Technical writing" },
  { id: "data-cleaning", name: "Data cleaning" },
  { id: "forecasting", name: "Forecasting" },
  { id: "data-visualization", name: "Data visualization" },
  { id: "process-mapping", name: "Process mapping" },
  { id: "ux-evaluation", name: "Usability evaluation" },
]);

// ── People ──
const extraStudents = [
  ["s-lucia", "Lucía Fernández"], ["s-omar", "Omar Haddad"], ["s-mei", "Mei Chen"],
  ["s-jonas", "Jonas Weber"], ["s-amara", "Amara Nwosu"], ["s-dev", "Dev Patel"],
] as const;
const people = [
  ...DEMO_PERSONAS.map((p) => ({ id: `u-${p.email.split("@")[0]}`, name: p.name, email: p.email, isStaff: p.role === "Program staff" })),
  ...extraStudents.map(([id, name]) => ({ id, name, email: `${id.slice(2)}@demo.test`, isStaff: false })),
];
const password = await hashPassword(DEMO_PASSWORD);
await db.insert(user).values(people.map((p) => ({ ...p, emailVerified: true })));
await db.insert(account).values(people.map((p) => ({ id: `a-${p.id}`, accountId: p.id, providerId: "credential", userId: p.id, password })));

// newbie@ deliberately has no profile, so signing in shows onboarding.
await db.insert(studentProfiles).values([
  { userId: "u-student", interests: ["vibration analysis", "Python", "maintenance"], goals: "Get hands-on with real sensor data and land a reliability internship.", weeklyHours: 6, timezone: "Europe/London", pronouns: "she/her", discipline: "Mechanical engineering", bio: "Third-year student who likes finding out why machines fail." },
  ...extraStudents.map(([id], i) => ({ userId: id, interests: [["data cleaning"], ["forecasting"], ["Python"], ["signal analysis"], ["visualization"], ["process mapping"]][i], weeklyHours: 4 + i, timezone: "UTC" })),
]);

await db.insert(skillClaims).values([
  { userId: "u-student", skillId: "python-data", level: "coursework", note: "Numerical Methods, year 2" },
  { userId: "u-student", skillId: "signal-analysis", level: "coursework", note: "Signals and Systems lab" },
  { userId: "u-student", skillId: "forecasting", level: "learning", note: "Online course, halfway through" },
  { userId: "s-jonas", skillId: "signal-analysis", level: "practical", note: "Built vibration sensor rigs for a robotics club" },
  { userId: "s-dev", skillId: "data-cleaning", level: "coursework", note: "Sports analytics module" },
  { userId: "s-dev", skillId: "python-data", level: "practical", note: "Part-time data assistant" },
]);

// ── Organizations ──
async function org(name: string, description: string, owner: string, mentors: string[], verified: boolean) {
  const [o] = await db.insert(organizations).values({ name, description, verifiedAt: verified ? new Date() : null, verifiedBy: verified ? "u-staff" : null }).returning();
  await db.insert(memberships).values([
    { userId: owner, orgId: o.id, role: "owner" as const },
    ...mentors.map((m) => ({ userId: m, orgId: o.id, role: "mentor" as const })),
  ]);
  return o;
}
const northwind = await org("Northwind Pumps (fictional)", "A made-up industrial pump maker. Reliability engineering and maintenance analytics.", "u-owner", ["u-mentor", "u-mentor2"], true);
const kestrel = await org("Kestrel Analytics (fictional)", "A made-up retail analytics consultancy. Data cleaning, forecasting and dashboards.", "u-owner2", ["u-mentor", "u-mentor2"], true);
const harbor = await org("Harbor Robotics (fictional)", "A made-up robotics startup that just joined and awaits staff verification.", "u-owner3", [], false);

// ── Projects: one per listing state, several published for discovery ──
type State = "draft" | "in_review" | "changes_requested" | "published" | "paused" | "closed";
const inDays = (n: number) => new Date(Date.now() + n * 864e5).toISOString().slice(0, 10);
const crit = (id: string, name: string, description: string, skillId?: string, critical = true): Criterion =>
  ({ id, name, description, critical, threshold: 3, skillId });
const defaults: Brief = {
  title: "", summary: "", problem: "", tier: "Q1", beginner: true, effortHours: 5, capacity: 3, mentorId: "u-mentor",
  backupContact: "Sam Rivera, staff@demo.test", compensation: "unpaid", compensationDetails: "", applyDeadline: inDays(45),
  deliverables: [], milestones: [], resources: "", terms: "Learning project. Company data stays private; the approved summary may go in your portfolio.",
  skillIds: [], prerequisites: [], rubric: [],
  discipline: "Mechanical engineering", mentorHours: 3, selectionMethod: "rubric", selectionDetails: "",
  expenses: "None expected.", paymentProcess: "", software: "Python 3 with pandas and numpy, or any tool you prefer.",
  startingKnowledge: "", portfolioRules: "You may publish the approved summary, not the company data.", confidentialNotes: "",
};

async function project(o: { id: string }, owner: string, state: State, b: Partial<Brief>, reviewNote?: string) {
  const brief = briefSchema.parse({ ...defaults, ...b });
  // Mentors confirmed everything that reached review; the changes-requested brief still waits for Mina.
  const confirmed = brief.mentorId && state !== "draft" && state !== "changes_requested" ? new Date() : null;
  const [p] = await db.insert(projects).values({ orgId: o.id, ownerId: owner, state, reviewNote, mentorConfirmedAt: confirmed,
    stateReason: state === "paused" ? "Operators are on shutdown this month; interviews resume in October." : state === "closed" ? "All labels collected for this round." : null }).returning();
  const [v] = await db.insert(briefVersions).values({
    projectId: p.id, version: 1, title: brief.title, summary: brief.summary, tier: brief.tier, beginner: brief.beginner,
    capacity: brief.capacity, xp: TIER_XP[brief.tier], mentorId: brief.mentorId || null, content: brief, createdBy: owner,
  }).returning();
  await db.update(projects).set({ currentVersionId: v.id }).where(eq(projects.id, p.id));
  return p;
}

// Northwind Pumps
await project(northwind, "u-owner", "published", {
  title: "Find the dominant frequencies in pump vibration data",
  summary: "Analyse a week of accelerometer readings from one pump and report which frequencies dominate and what they suggest.",
  problem: "Maintenance staff want to know whether the vibration spectrum shows early bearing wear before the next planned shutdown.",
  deliverables: ["A reproducible notebook", "A one-page summary of findings and their limits"],
  milestones: [{ title: "Plot the raw signal and a first spectrum", dueInDays: 4 }, { title: "Final notebook and summary", dueInDays: 10 }],
  resources: "CSV of 3-axis accelerometer data sampled at 1 kHz. Worked FFT example notebook.",
  startingKnowledge: "What a Fourier transform shows. Basic Python.", confidentialNotes: "Pump P-204 on line 3. The data is from the week before its last bearing replacement.",
  skillIds: ["signal-analysis", "python-data"],
  rubric: [
    crit("c1", "Signal analysis", "Correct spectrum, sensible windowing, peaks identified and explained.", "signal-analysis"),
    crit("c2", "Reproducible code", "Notebook runs top to bottom on the provided data.", "python-data"),
    crit("c3", "Communication", "Summary states findings and limits in plain language.", undefined, false),
  ],
});
await project(northwind, "u-owner", "published", {
  title: "Compare two fault-detection methods on bearing data",
  summary: "Apply envelope analysis and a spectral-kurtosis check to labelled bearing data, then recommend one for the monitoring dashboard.",
  problem: "The reliability team must pick one fault-detection method for its dashboard and wants an evidence-based recommendation.",
  tier: "Q2", beginner: false, effortHours: 12, capacity: 2, mentorId: "u-mentor2", compensation: "stipend", compensationDetails: "€150 on accepted completion",
  paymentProcess: "Northwind pays by bank transfer within 30 days, through its supplier process. Program staff hold the agreement.", mentorHours: 4,
  deliverables: ["Notebook comparing both methods", "A two-page recommendation memo"],
  milestones: [{ title: "Method plan agreed with mentor", dueInDays: 5 }, { title: "Comparison and memo", dueInDays: 20 }],
  resources: "Labelled bearing dataset with healthy and faulty runs.",
  skillIds: ["signal-analysis", "technical-writing"],
  prerequisites: [{ skillId: "signal-analysis", minTier: "emerging" }],
  rubric: [
    crit("c1", "Method comparison", "Both methods applied correctly and compared on the same data.", "signal-analysis"),
    crit("c2", "Recommendation", "Clear choice with trade-offs and limits.", "technical-writing"),
  ],
});
await project(northwind, "u-owner", "in_review", {
  title: "Clean a year of maintenance logs",
  summary: "Tidy a messy export of maintenance tickets and document every quality issue you find along the way.",
  problem: "Ticket data is too inconsistent to report on: free-text dates, duplicate assets, missing closure codes.",
  deliverables: ["Cleaned CSV", "Data quality notes"],
  milestones: [{ title: "Cleaned data and notes", dueInDays: 7 }],
  skillIds: ["data-cleaning"],
  rubric: [crit("c1", "Data cleaning", "Issues found, fixed and documented.", "data-cleaning")],
});
await project(northwind, "u-owner", "changes_requested", {
  title: "Map the pump assembly workflow",
  summary: "Turn approved observation notes into a process map of the pump assembly line and flag waiting time.",
  problem: "Assembly lead times vary a lot and nobody has a shared picture of the process.",
  effortHours: 30, skillIds: ["process-mapping"], discipline: "Manufacturing",
  deliverables: ["Process map", "List of delays with evidence"],
  milestones: [{ title: "Draft map", dueInDays: 6 }, { title: "Final map and delay list", dueInDays: 12 }],
  rubric: [crit("c1", "Process map", "Complete, readable, matches the observation notes.", "process-mapping")],
}, "30 hours is too much for a Q1 starter. Cut the scope to one assembly station or move it to Q2.");
await project(northwind, "u-owner", "draft", {
  title: "Predict seal failures from pressure logs",
  summary: "Early draft: explore whether pressure patterns predict seal failures.",
  problem: "Seal failures cause unplanned downtime.", tier: "Q2", beginner: false, mentorId: "", compensation: "",
});
await project(northwind, "u-owner", "paused", {
  title: "Summarize operator interview notes",
  summary: "Group authorized interview notes from pump operators into themes and back each theme with quotes.",
  problem: "Operators report usability issues with the control panel, but the notes are unstructured.",
  skillIds: ["ux-evaluation"], deliverables: ["Theme table with supporting quotes"], discipline: "Business",
  milestones: [{ title: "Theme table", dueInDays: 8 }],
  rubric: [crit("c1", "Synthesis", "Themes are distinct and each is backed by quotes.", "ux-evaluation")],
});
await project(northwind, "u-owner", "closed", {
  title: "Label a small image set of pump casings",
  summary: "Label 300 photos of pump casings for visible corrosion using the provided guide.",
  problem: "The inspection team wants a labelled starter set for a future model.",
  effortHours: 3, skillIds: ["data-cleaning"], deliverables: ["Labelled image index"],
  milestones: [{ title: "Labels", dueInDays: 5 }],
  rubric: [crit("c1", "Label quality", "Labels follow the guide; ambiguous cases flagged.", "data-cleaning")],
});

// Kestrel Analytics
await project(kestrel, "u-owner2", "published", {
  title: "Clean a retail sales dataset",
  summary: "Fix types, duplicates and outliers in two years of store sales and write down every decision you make.",
  problem: "Analysts lose a day each month cleaning the same export by hand.",
  effortHours: 6, capacity: 4, compensation: "paid", compensationDetails: "€300 fixed fee, paid by Kestrel within 30 days of acceptance",
  discipline: "Data analysis", paymentProcess: "Kestrel invoices through the university's student-contractor scheme.", selectionMethod: "first_come",
  skillIds: ["data-cleaning", "python-data"],
  deliverables: ["Cleaning script", "Decision log"],
  milestones: [{ title: "Profiling report", dueInDays: 3 }, { title: "Script and decision log", dueInDays: 9 }],
  resources: "Sales export (CSV, 180k rows). Column descriptions.",
  rubric: [
    crit("c1", "Data cleaning", "Issues are found, fixed and justified.", "data-cleaning"),
    crit("c2", "Reproducible code", "Script runs end to end on a fresh export.", "python-data"),
  ],
});
await project(kestrel, "u-owner2", "published", {
  title: "Write a data dictionary for the loyalty database",
  summary: "Document 40 tables of the loyalty programme database so new analysts can find their way.",
  problem: "New analysts take weeks to learn which tables matter.",
  effortHours: 5, capacity: 2, mentorId: "u-mentor2", compensation: "course", compensationDetails: "Counts towards the Applied Data module if your course allows it",
  discipline: "Data analysis", software: "Any text editor. Read-only database access is provided.",
  skillIds: ["technical-writing"],
  deliverables: ["Data dictionary document"],
  milestones: [{ title: "First 10 tables", dueInDays: 4 }, { title: "Complete dictionary", dueInDays: 10 }],
  rubric: [crit("c1", "Clarity", "Definitions are accurate and readable by a new analyst.", "technical-writing")],
});
await project(kestrel, "u-owner2", "published", {
  title: "Build a weekly demand forecast baseline",
  summary: "Produce a simple, validated forecast for 20 product lines and explain where it fails.",
  problem: "Buyers order stock on gut feel and want a baseline to compare against.",
  tier: "Q2", beginner: false, effortHours: 14, capacity: 2, compensation: "paid", compensationDetails: "€600 fixed fee",
  discipline: "Data analysis", paymentProcess: "Kestrel invoices through the university's student-contractor scheme.", mentorHours: 5, selectionMethod: "lottery", selectionDetails: "Lottery among eligible applicants on the deadline.",
  skillIds: ["forecasting", "python-data"],
  prerequisites: [{ skillId: "data-cleaning", minTier: "emerging" }, { skillId: "python-data", minTier: "emerging" }],
  deliverables: ["Forecast notebook", "Validation report"],
  milestones: [{ title: "Baseline and validation plan", dueInDays: 7 }, { title: "Validated forecast and report", dueInDays: 21 }],
  rubric: [
    crit("c1", "Forecast method", "Baseline is appropriate and validated on held-out weeks.", "forecasting"),
    crit("c2", "Reproducible code", "Notebook reruns cleanly.", "python-data"),
  ],
});
await project(kestrel, "u-owner2", "published", {
  title: "Review a sales dashboard for accessibility",
  summary: "Check a sales dashboard against a short accessibility brief and propose concrete fixes.",
  problem: "Store managers with low vision struggle with the current colour-only charts.",
  effortHours: 4, capacity: 3, mentorId: "u-mentor", skillIds: ["ux-evaluation", "data-visualization"], discipline: "Design", applyDeadline: inDays(5),
  deliverables: ["Findings table", "Annotated screenshots with fixes"],
  milestones: [{ title: "Findings table", dueInDays: 5 }],
  rubric: [
    crit("c1", "Evaluation", "Findings cite the brief and are reproducible.", "ux-evaluation"),
    crit("c2", "Fix quality", "Proposed fixes are specific and feasible.", "data-visualization"),
  ],
});
await project(kestrel, "u-owner2", "in_review", {
  title: "Explain churn in the loyalty programme",
  summary: "Describe who leaves the loyalty programme and when, using three years of anonymised data.",
  problem: "Marketing wants to know where to focus retention offers.",
  effortHours: 6, compensation: "paid", compensationDetails: "€300 fixed fee", skillIds: ["data-visualization"], discipline: "Data analysis", paymentProcess: "Kestrel invoices through the university's student-contractor scheme.",
  deliverables: ["Churn analysis notebook", "Five-slide summary"],
  milestones: [{ title: "Notebook and slides", dueInDays: 10 }],
  rubric: [crit("c1", "Analysis", "Churn is defined clearly and patterns are supported.", "data-visualization")],
});

// Harbor Robotics (unverified: can draft, can't submit)
await project(harbor, "u-owner3", "draft", {
  title: "Calibrate a line-following sensor array",
  summary: "Collect and analyse calibration readings from a five-sensor array and propose thresholds.",
  problem: "Robots drift off the line on glossy floors.", mentorId: "", skillIds: ["signal-analysis"],
  deliverables: ["Calibration notebook"], milestones: [{ title: "Readings and thresholds", dueInDays: 7 }],
  rubric: [crit("c1", "Calibration", "Thresholds are justified by the readings.", "signal-analysis")],
});

console.log(`Seeded ${people.length} people, 3 organizations, 13 projects.`);
console.log(`Demo accounts (password "${DEMO_PASSWORD}"): ${DEMO_PERSONAS.map((p) => p.email).join(", ")}`);
await db.pool.end();
