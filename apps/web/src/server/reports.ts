import { sql } from "drizzle-orm";
import type { Db } from "@iq/db";
import { listProjects } from "./discovery";

export type Metric = { key: string; label: string; why: string; n: number; d: number; ids: string[]; unit?: "ratio" | "hours" | "count" };

// PRD §7.1–7.2, AC-21. Every number traces back to record ids. Revoked credentials never count, and
// demo organizations are left out unless asked for.
export async function pilotReport(db: Db, includeDemo: boolean) {
  const demo = includeDemo ? sql`true` : sql`not o.is_demo`;
  const rows = async <T,>(q: ReturnType<typeof sql>) => (await db.execute(q)).rows as T[];

  const north = await rows<{ student: string; id: string }>(sql`
    select distinct on (c.user_id) c.user_id as student, c.id from credentials c
    join enrollments e on e.id = c.enrollment_id join projects p on p.id = e.project_id join organizations o on o.id = p.org_id
    where c.kind = 'completion' and c.status = 'active' and c.created_at > now() - interval '30 days' and ${demo}`);
  const students = await rows<{ id: string; created_at: Date; first_start: Date | null }>(sql`
    select sp.user_id as id, sp.created_at, min(e.accepted_at) as first_start from student_profiles sp
    left join enrollments e on e.student_id = sp.user_id and e.accepted_at is not null
    left join projects p on p.id = e.project_id left join organizations o on o.id = p.org_id and ${demo}
    group by sp.user_id, sp.created_at`);
  const ended = await rows<{ id: string; state: string }>(sql`
    select e.id, e.state from enrollments e join projects p on p.id = e.project_id join organizations o on o.id = p.org_id
    where e.accepted_at is not null and e.state in ('completed', 'closed_incomplete', 'withdrawn') and ${demo}`);
  const reviews = await rows<{ id: string; hours: number }>(sql`
    select a.id, extract(epoch from a.created_at - s.created_at) / 3600 as hours from assessments a
    join submissions s on s.id = a.submission_id join enrollments e on e.id = s.enrollment_id
    join projects p on p.id = e.project_id join organizations o on o.id = p.org_id where ${demo}`);
  const completers = await rows<{ student: string; again: boolean }>(sql`
    select first.student_id as student, exists (
      select 1 from enrollments later where later.student_id = first.student_id and later.accepted_at > first.completed_at) as again
    from (select student_id, min(completed_at) as completed_at from enrollments e join projects p on p.id = e.project_id
          join organizations o on o.id = p.org_id where e.state = 'completed' and ${demo} group by student_id) first`);
  const completed = await rows<{ id: string; evidenced: boolean }>(sql`
    select e.id, exists (select 1 from assessments a join submissions s on s.id = a.submission_id
      where s.enrollment_id = e.id and a.decision = 'accept') as evidenced
    from enrollments e join projects p on p.id = e.project_id join organizations o on o.id = p.org_id where e.state = 'completed' and ${demo}`);
  const emailFailures = await rows<{ id: string }>(sql`select id from notifications where email_error is not null`);

  // Opportunity coverage: students who could apply to at least one open project right now.
  const covered: string[] = [];
  for (const s of students) {
    const { cards } = await listProjects(db, { id: s.id }, { openOnly: true });
    if (cards.some((c) => c.fit?.eligible && !c.myState)) covered.push(s.id);
  }

  const within14 = students.filter((s) => s.first_start && +new Date(s.first_start) - +new Date(s.created_at) <= 14 * 864e5);
  const hours = reviews.map((r) => Number(r.hours)).sort((a, b) => a - b);
  const median = hours.length ? hours[Math.floor(hours.length / 2)] : 0;
  const metrics: Metric[] = [
    { key: "north", label: "Students with a verified project in the last 30 days", why: "North-star metric (§7.1). Active completion credentials only.",
      n: north.length, d: students.length, ids: north.map((r) => r.id), unit: "count" },
    { key: "activation", label: "Started a project within 14 days of joining", why: "First-project activation.",
      n: within14.length, d: students.length, ids: within14.map((s) => s.id) },
    { key: "coverage", label: "Students with an open project they can join", why: "Opportunity coverage: is there real inventory for them?",
      n: covered.length, d: students.length, ids: covered },
    { key: "completion", label: "Accepted projects that ended in completion", why: "Counts withdrawals and non-completions, so nothing is hidden.",
      n: ended.filter((e) => e.state === "completed").length, d: ended.length, ids: ended.map((e) => e.id) },
    { key: "turnaround", label: "Reviews within five business days", why: `Median review time: ${Math.round(median)} hours.`,
      n: hours.filter((h) => h <= 7 * 24).length, d: hours.length, ids: reviews.map((r) => r.id) },
    { key: "repeat", label: "Completers who started another project", why: "Repeat participation.",
      n: completers.filter((c) => c.again).length, d: completers.length, ids: completers.map((c) => c.student) },
    { key: "evidence", label: "Completions backed by a rubric review", why: "Evidence coverage: every credential must trace to a review.",
      n: completed.filter((c) => c.evidenced).length, d: completed.length, ids: completed.map((c) => c.id) },
    { key: "email", label: "Emails that failed to send", why: "A failed email isn't proof the person got the message (INT-02).",
      n: emailFailures.length, d: 0, ids: emailFailures.map((r) => r.id), unit: "count" },
  ];
  return metrics;
}
