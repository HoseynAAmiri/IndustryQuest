// Demo stories on top of the base seed (packages/db/src/seed.ts). Every step runs the real domain
// function, so the data obeys the same rules, keys and checks as live use. Fictional data only.
import { eq, sql } from "drizzle-orm";
import type { Score } from "@iq/core";
import { briefVersions, connect, credentials, files, projects, savedProjects, submissions } from "@iq/db";
import { apply, expireStaleOffers, makeOffer, reject, respondToOffer, withdraw } from "../src/server/enrollments";
import { assess } from "../src/server/review";
import { addLink, postMessage, submit, toggleMilestone } from "../src/server/workspace";
import { setCredentialPublic } from "../src/server/credentials";
import { reviseBrief } from "../src/server/projects";
import { briefSchema } from "@iq/core";
import { addCaseUpdate, openCase, resolveCase } from "../src/server/cases";
import { grantEquivalency } from "../src/server/staff";

if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed a production database.");
const db = connect(process.env.DATABASE_URL!);
const as = (id: string) => ({ id });
const [ada, mei, lucia, omar, amara, jonas, dev] = ["u-student", "s-mei", "s-lucia", "s-omar", "s-amara", "s-jonas", "s-dev"].map(as);
const [olive, kofi, mina, theo, sam] = ["u-owner", "u-owner2", "u-mentor", "u-mentor2", "u-staff"].map(as);

const ids = Object.fromEntries((await db.select({ id: projects.id, title: briefVersions.title }).from(projects)
  .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))).map((r) => [r.title, r.id]));
const P = {
  vibration: ids["Find the dominant frequencies in pump vibration data"],
  bearing: ids["Compare two fault-detection methods on bearing data"],
  retail: ids["Clean a retail sales dataset"],
  dictionary: ids["Write a data dictionary for the loyalty database"],
  forecast: ids["Build a weekly demand forecast baseline"],
  dashboard: ids["Review a sales dashboard for accessibility"],
};

// Move everything that belongs to one enrollment back in time, so earlier steps end up further in the past.
async function back(e: string, days: number) {
  const i = sql`${days} * interval '1 day'`;
  await db.execute(sql`update enrollments set created_at = created_at - ${i}, updated_at = updated_at - ${i},
    accepted_at = accepted_at - ${i}, completed_at = completed_at - ${i}, offer_expires_at = offer_expires_at - ${i} where id = ${e}`);
  await db.execute(sql`update milestones set due_at = due_at - ${i}, done_at = done_at - ${i} where enrollment_id = ${e}`);
  for (const t of ["messages", "files", "submissions", "xp_transactions", "skill_evidence", "credentials"])
    await db.execute(sql`update ${sql.identifier(t)} set created_at = created_at - ${i} where enrollment_id = ${e}`);
  await db.execute(sql`update assessments set created_at = created_at - ${i} where submission_id in (select id from submissions where enrollment_id = ${e})`);
  await db.execute(sql`update notifications set created_at = created_at - ${i} where dedupe_key like ${`%${e}%`}`);
  await db.execute(sql`update events set created_at = created_at - ${i} where subject_id = ${e}`);
  await db.execute(sql`update audit_events set created_at = created_at - ${i} where target_id = ${e} or target_id in (select id::text from submissions where enrollment_id = ${e})`);
}

const scores = (...s: (number | null)[]): Score[] => s.map((score, n) => ({ criterionId: `c${n + 1}`, score, ...(score === null && { naReason: "Not part of this task" }) }));
const fileIds = async (e: string) => (await db.select({ id: files.id }).from(files).where(eq(files.enrollmentId, e))).map((f) => f.id);
const latest = async (e: string) => (await db.select().from(submissions).where(eq(submissions.enrollmentId, e)).orderBy(sql`version desc`).limit(1))[0].id;
let keys = 0;

async function join(student: { id: string }, project: string, owner: { id: string }, motivation: string) {
  const e = await apply(db, student, { projectId: project, motivation, availability: "About 6 hours a week, mostly evenings." });
  await back(e, 3);
  await makeOffer(db, owner, { enrollmentId: e });
  await back(e, 2);
  await respondToOffer(db, student, { enrollmentId: e, accept: true, agreed: true });
  return e;
}
async function hand(student: { id: string }, e: string, name: string, statement: string, reflection = "") {
  if (!(await fileIds(e)).length) await addLink(db, student, { enrollmentId: e, name, url: `https://example.org/demo/${student.id}/${keys}` });
  await submit(db, student, { enrollmentId: e, clientKey: `demo-${keys++}`, contributionStatement: statement, reflection, fileIds: await fileIds(e) });
  return latest(e);
}
// ── Mei: two accepted projects with two reviewers → Bronze in Signal analysis ──
{
  const e = await join(mei, P.vibration, olive, "I've done FFT labs in my signals course and want to try it on real machine data.");
  await back(e, 6);
  const s = await hand(mei, e, "Vibration notebook", "I cleaned the three axes, applied a Hann window, computed the spectrum and traced the 3x running-speed peak to the bearing.");
  await back(e, 2);
  await assess(db, mina, { submissionId: s, scores: scores(4, 3, 3), decision: "accept", comment: "Excellent windowing choice and a careful explanation of the harmonics." });
  await back(e, 30);
  await setCredentialPublic(db, mei, { credentialId: (await db.select().from(credentials).where(eq(credentials.enrollmentId, e)))[0].id, isPublic: true });
}
{
  const e = await join(mei, P.bearing, olive, "My vibration project left me curious about which fault method works best on bearings.");
  await back(e, 8);
  const s = await hand(mei, e, "Method comparison notebook", "I implemented envelope analysis and spectral kurtosis on the same labelled runs and compared detection rates.");
  await back(e, 3);
  await assess(db, theo, { submissionId: s, scores: scores(3, 4), decision: "accept", comment: "A fair comparison with honest limits. The memo is ready to share with the reliability team." });
  await back(e, 6);
}

// ── Ada: the full story from the PRD demo (§25.3) ──
{
  const e = await join(ada, P.vibration, olive, "I've learned Fourier analysis in class but never used it on real equipment. I'd like to see what bearing wear looks like.");
  await back(e, 1);
  const [m] = (await db.execute<{ id: string }>(sql`select id from milestones where enrollment_id = ${e} order by due_at limit 1`)).rows;
  await toggleMilestone(db, ada, m.id);
  await postMessage(db, ada, { enrollmentId: e, body: "Hi Mina! The z-axis has a big DC offset. Should I remove the mean before the FFT or detrend?" });
  await back(e, 1);
  await postMessage(db, mina, { enrollmentId: e, body: "Good catch. Detrend first, then window. Removing only the mean leaves a slow drift that smears the low end." });
  await back(e, 3);
  const v1 = await hand(ada, e, "Vibration analysis notebook", "I plotted the raw signal and computed a spectrum for each axis. The largest peak is at 49.6 Hz.",
    "I wasn't sure how to decide which peaks matter.");
  await back(e, 2);
  await assess(db, mina, { submissionId: v1, scores: scores(2, 3, 3), decision: "revise", comment: "The spectrum is right, but it has no window, so the peaks leak into each other. Apply a Hann window, label the axes in Hz and explain the 3x running-speed peak.", revisionDays: 7 });
  await back(e, 3);
  await postMessage(db, ada, { enrollmentId: e, body: "Revised with a Hann window. The 3x peak is much clearer now." });
  const v2 = await hand(ada, e, "", "I detrended and windowed each axis, identified the 1x and 3x running-speed peaks and explained why the 3x peak suggests early bearing wear.",
    "Windowing made a bigger difference than I expected. Next time I'll check leakage before interpreting peaks.");
  await back(e, 1);
  await assess(db, mina, { submissionId: v2, scores: scores(3, 4, 3), decision: "accept", comment: "Much better. Clear, correct and appropriately cautious about what the data can show." });
  await back(e, 12);
  const [c] = await db.select().from(credentials).where(eq(credentials.enrollmentId, e));
  await setCredentialPublic(db, ada, { credentialId: c.id, isPublic: true });
}
{
  const e = await join(ada, P.retail, kofi, "I want practice cleaning messy data properly and writing down my decisions.");
  await back(e, 3);
  const [m] = (await db.execute<{ id: string }>(sql`select id from milestones where enrollment_id = ${e} order by due_at limit 1`)).rows;
  await toggleMilestone(db, ada, m.id);
  await addLink(db, ada, { enrollmentId: e, name: "Profiling report (draft)", url: "https://example.org/demo/ada/profiling-report" });
  await postMessage(db, ada, { enrollmentId: e, body: "About 2% of rows have negative quantities. Returns, or errors?" });
  await back(e, 1);
  await postMessage(db, mina, { enrollmentId: e, body: "Returns. Keep them, flag them, and note the decision in your log." });
  await back(e, 1);
}
{
  const e = await apply(db, ada, { projectId: P.bearing, motivation: "My vibration project gave me Emerging in Signal analysis and I'd like to compare fault-detection methods next.", availability: "6 hours a week" });
  await back(e, 2);
}
{
  const e = await apply(db, ada, { projectId: P.dashboard, motivation: "I care about accessible charts and want to learn how to evaluate them.", availability: "6 hours a week" });
  await makeOffer(db, kofi, { enrollmentId: e });
  await back(e, 9); // offer ran out → Offer expired
}
await db.insert(savedProjects).values([{ userId: ada.id, projectId: P.forecast }, { userId: ada.id, projectId: P.dashboard }]);

// ── Mentor queues and company decisions ──
{
  const e = await join(amara, P.dictionary, kofi, "I write documentation for my student society and want to do it for a real database.");
  await back(e, 4);
  await hand(amara, e, "Data dictionary v1", "I documented all 40 tables with purpose, key columns and joins, and flagged 6 unused tables.");
  await back(e, 2);
}
{
  const e = await apply(db, ada, { projectId: P.dictionary, motivation: "Clear documentation helps analysts. I'd like to practise technical writing.", availability: "6 hours a week" });
  await makeOffer(db, kofi, { enrollmentId: e });
  await back(e, 2); // live offer, about 3 days left; with Amara the project is now full
}
{
  const e = await join(lucia, P.retail, kofi, "Data cleaning is my favourite part of analysis and I'd like feedback from a professional.");
  await back(e, 5);
  await hand(lucia, e, "Cleaning script and decision log", "I wrote a pandas script that fixes types, removes 312 duplicates and caps outliers, with a log of each decision.");
  await back(e, 10); // past the review target, so it shows up as an escalation
}
{
  const e = await join(omar, P.vibration, olive, "I'm switching from software to mechanical diagnostics and want real practice.");
  await back(e, 3);
  const s = await hand(omar, e, "Spectrum notebook", "I computed the spectrum of the x-axis.");
  await back(e, 1);
  await assess(db, mina, { submissionId: s, scores: scores(2, 2, null), decision: "revise", comment: "Only one axis is analysed and the notebook fails at cell 4. Analyse all three axes and make it run top to bottom.", revisionDays: 7 });
  await back(e, 1);
}
{
  await apply(db, jonas, { projectId: P.vibration, motivation: "I build sensor rigs as a hobby and want to analyse data from real pumps.", availability: "5 hours a week" });
  const e = await apply(db, jonas, { projectId: P.dashboard, motivation: "I'm interested in dashboards and would like to learn accessibility.", availability: "5 hours a week" });
  await reject(db, kofi, { enrollmentId: e, note: "We picked applicants with prior usability coursework this round. Please apply again next term." });
  await back(e, 4);
}
{
  const e = await join(dev, P.vibration, olive, "I'd like hands-on signal processing experience.");
  await withdraw(db, dev, e);
  await back(e, 10);
  await apply(db, dev, { projectId: P.retail, motivation: "I've cleaned sports datasets for fun and want to try retail data.", availability: "9 hours a week" });
}
{
  const e = await apply(db, lucia, { projectId: P.dashboard, motivation: "I'd like to learn how accessibility reviews are done on real dashboards.", availability: "4 hours a week" });
  await makeOffer(db, kofi, { enrollmentId: e });
  await respondToOffer(db, lucia, { enrollmentId: e, accept: false });
  await back(e, 5); // Offer declined
}
{
  const e = await join(amara, P.dashboard, kofi, "Accessibility matters to me and I want to learn a structured way to review it.");
  await back(e, 10);
  const s = await hand(amara, e, "Findings table", "I listed three colour issues from the dashboard.");
  await back(e, 4);
  await assess(db, mina, { submissionId: s, scores: scores(1, 1), decision: "not_complete", comment: "The findings don't reference the accessibility brief and no fixes are proposed. The project ended before a revision could be arranged; talk to staff if you'd like to appeal or retry." });
  await back(e, 6); // Closed, not completed
}
// ── Scope change waiting for Ada's consent (AC-06) ──
{
  const [row] = (await db.execute<{ content: unknown }>(sql`select v.content from projects p join brief_versions v on v.id = p.current_version_id where p.id = ${P.retail}`)).rows;
  const b = briefSchema.parse(row.content);
  await reviseBrief(db, kofi, { projectId: P.retail, material: true, reason: "Our buyers asked for a per-region view, so the brief now includes a short region breakdown table.",
    brief: { ...b, deliverables: [...b.deliverables, "Region breakdown table"], effortHours: b.effortHours + 1 } });
}

// ── Cases: one of each kind, open and resolved ──
const enrollmentOf = async (student: string, project: string) =>
  (await db.execute<{ id: string }>(sql`select id from enrollments where student_id = ${student} and project_id = ${project} order by created_at desc limit 1`)).rows[0].id;
{
  const c = await openCase(db, omar, { type: "extension", enrollmentId: await enrollmentOf(omar.id, P.vibration), requestedDays: 5,
    summary: "I have two exams next week. Could I have five more days for the revision?" });
  await db.execute(sql`update cases set created_at = now() - interval '1 day', due_at = now() + interval '4 days' where id = ${c.id}`);
}
{
  const c = await openCase(db, amara, { type: "appeal", enrollmentId: await enrollmentOf(amara.id, P.dashboard),
    summary: "The brief's accessibility checklist link was broken, so I used WCAG directly. I think that's why my findings didn't cite the brief." });
  await db.execute(sql`update cases set created_at = now() - interval '6 days', due_at = now() - interval '1 day' where id = ${c.id}`); // overdue
}
{
  const e = await enrollmentOf(ada.id, P.retail);
  const c = await openCase(db, ada, { type: "blocker", enrollmentId: e, summary: "The sales export is missing the store region column mentioned in the brief." });
  await addCaseUpdate(db, sam, { caseId: c.id, body: "Thanks Ada. I've asked Kofi for the full export." });
  await resolveCase(db, sam, { caseId: c.id, resolution: "Kofi uploaded the full export with regions on the Files tab. No change to your deadlines was needed.", action: { kind: "none" } });
  await db.execute(sql`update cases set created_at = now() - interval '2 days', resolved_at = now() - interval '1 day' where id = ${c.id}`);
}
{
  const c = await openCase(db, lucia, { type: "support", summary: "I changed universities. Can I keep my account with my personal email?" });
  await resolveCase(db, sam, { caseId: c.id, resolution: "Yes. Your account and records belong to you, not the university. Change your email from Profile, Details.", action: { kind: "none" } });
  await db.execute(sql`update cases set created_at = now() - interval '12 days', resolved_at = now() - interval '11 days' where id = ${c.id}`);
}

// ── Equivalency reviews: one accepted, one waiting (AC-22) ──
await grantEquivalency(db, sam, { userId: jonas.id, skillId: "signal-analysis", evidence: "Two seasons building vibration rigs for the robotics club; club lead confirmed and shared his analysis notebooks." });
{
  const c = await openCase(db, dev, { type: "equivalency", skillId: "data-cleaning",
    summary: "I worked 18 months as a part-time data assistant cleaning sports datasets. My manager can confirm and I can share samples." });
  await db.execute(sql`update cases set created_at = now() - interval '2 days', due_at = now() + interval '3 days' where id = ${c.id}`);
}

await expireStaleOffers(db);

// Anything older than three days has been seen already.
await db.execute(sql`update notifications set read_at = created_at + interval '1 hour' where created_at < now() - interval '3 days'`);

const counts = await db.execute<{ state: string; n: number }>(sql`select state, count(*)::int as n from enrollments group by state order by state`);
console.log("Demo stories:", counts.rows.map((r) => `${r.state} ${r.n}`).join(", "));
await db.pool.end();
