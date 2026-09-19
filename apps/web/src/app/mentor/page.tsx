import type { Metadata } from "next";
import Link from "next/link";
import { and, asc, desc, eq, inArray, isNull, lt, ne } from "drizzle-orm";
import { ArrowRight, ClipboardCheck, Clock, Inbox, Users } from "lucide-react";
import { assessments, briefVersions, cases, enrollments, mentorProfiles, messages as msgs, milestones, organizations, projects, submissions, user } from "@iq/db";
import { mentorProfileAction, welcomeAction } from "./actions";
import { Field, SelectField } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { confirmMentoringAction } from "@/app/company/actions";
import { Alert, Button, EnrollmentBadge, Page, messages, when } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Stat } from "@/app/dashboard";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Review queue" };

const businessDaysSince = (d: Date) => {
  let n = 0;
  for (const t = new Date(d); t < new Date(); t.setDate(t.getDate() + 1)) if (t.getDay() % 6) n++;
  return Math.max(0, n - 1);
};

export default async function Mentor({ searchParams }: PageProps<"/mentor">) {
  const me = await requireUser();
  const db = getDb();
  const { error } = await messages(searchParams);
  const mine = await db.select({ e: enrollments, title: briefVersions.title, student: user.name }).from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(and(eq(enrollments.mentorId, me.id), inArray(enrollments.state, ["active", "submitted", "revision_requested", "completed"])))
    .orderBy(desc(enrollments.updatedAt));
  const queue = await Promise.all(mine.filter((m) => m.e.state === "submitted").map(async (m) => {
    const [s] = await db.select().from(submissions).where(eq(submissions.enrollmentId, m.e.id)).orderBy(desc(submissions.version)).limit(1);
    return { ...m, s };
  }));
  const reviewed = await db.select({ a: assessments, title: briefVersions.title, student: user.name }).from(assessments)
    .innerJoin(submissions, eq(submissions.id, assessments.submissionId))
    .innerJoin(enrollments, eq(enrollments.id, submissions.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(eq(assessments.assessorId, me.id)).orderBy(desc(assessments.createdAt)).limit(5);
  const asks = await db.select({ id: projects.id, title: briefVersions.title, org: organizations.name, content: briefVersions.content }).from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId)).innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(and(eq(briefVersions.mentorId, me.id), isNull(projects.mentorConfirmedAt)));
  const [mp] = await db.select().from(mentorProfiles).where(eq(mentorProfiles.userId, me.id));
  const ids = mine.map((m) => m.e.id);
  const [questions, checkpoints, blocked] = ids.length ? await Promise.all([
    db.select({ m: msgs, e: enrollments.id, student: user.name }).from(msgs).innerJoin(enrollments, eq(enrollments.id, msgs.enrollmentId))
      .innerJoin(user, eq(user.id, msgs.authorId))
      .where(and(inArray(msgs.enrollmentId, ids), eq(msgs.isQuestion, true), isNull(msgs.answeredAt), ne(msgs.authorId, me.id))).orderBy(asc(msgs.createdAt)),
    db.select({ ms: milestones, e: enrollments.id, student: user.name }).from(milestones).innerJoin(enrollments, eq(enrollments.id, milestones.enrollmentId))
      .innerJoin(user, eq(user.id, enrollments.studentId))
      .where(and(inArray(milestones.enrollmentId, ids), isNull(milestones.doneAt), inArray(enrollments.state, ["active", "revision_requested"]),
        lt(milestones.dueAt, new Date(Date.now() + 7 * 864e5)))).orderBy(asc(milestones.dueAt)),
    // Only that a blocker or extension request is open; its text stays between the student and staff.
    db.select({ e: cases.enrollmentId, type: cases.type, student: user.name }).from(cases).innerJoin(user, eq(user.id, cases.reporterId))
      .where(and(inArray(cases.enrollmentId, ids), inArray(cases.type, ["blocker", "extension"]), ne(cases.status, "resolved"))),
  ]) : [[], [], []];
  const mentees = mine.filter((m) => m.e.state !== "submitted" && m.e.state !== "completed");
  const overdue = queue.filter((q) => businessDaysSince(q.s.createdAt) > 5).length;

  return (
    <Page title="Review queue" description="Submissions waiting for you, and the students you support.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert></div>
      {asks.map((a) => (
        <Card key={a.id} className="mb-6 border-primary/50 bg-primary/5">
          <CardHeader>
            <CardDescription>{a.org} asked you to mentor</CardDescription>
            <CardTitle className="text-base">{a.title}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-center gap-3 text-sm">
            <span className="flex-1 text-muted-foreground">About {a.content.mentorHours ?? 0} hours per student, {a.content.capacity} {a.content.capacity === 1 ? "place" : "places"}. Confirm only if you can support that.</span>
            <Button asChild size="sm" variant="ghost"><Link href={`/projects/${a.id}`}>Read the brief</Link></Button>
            <form action={confirmMentoringAction}><input type="hidden" name="projectId" value={a.id} /><Button size="sm">Confirm I'll mentor</Button></form>
          </CardContent>
        </Card>
      ))}
      {(questions.length > 0 || checkpoints.length > 0 || blocked.length > 0) && (
        <Card className="mb-6">
          <CardHeader><CardTitle>Needs you this week</CardTitle><CardDescription>Unanswered questions first, then checkpoints and students waiting on help.</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {questions.map((q) => (
                <li key={q.m.id}><Link href={`/workspace/${q.e}?tab=discussion`} className="press flex gap-3 p-3 hover:bg-muted/50">
                  <Badge variant="secondary">Question</Badge>
                  <span className="min-w-0 flex-1 truncate text-sm"><span className="font-medium">{q.student}:</span> {q.m.body}</span>
                  <span className="text-xs text-muted-foreground">{when(q.m.createdAt)}</span>
                </Link></li>
              ))}
              {checkpoints.map((c) => (
                <li key={c.ms.id}><Link href={`/workspace/${c.e}`} className="press flex gap-3 p-3 hover:bg-muted/50">
                  <Badge variant={c.ms.dueAt < new Date() ? "destructive" : "outline"}>{c.ms.dueAt < new Date() ? "Overdue" : "Checkpoint"}</Badge>
                  <span className="flex-1 text-sm"><span className="font-medium">{c.student}:</span> {c.ms.title}</span>
                  <span className="text-xs text-muted-foreground">{when(c.ms.dueAt)}</span>
                </Link></li>
              ))}
              {blocked.map((b, i) => (
                <li key={i}><Link href={`/workspace/${b.e}`} className="press flex gap-3 p-3 hover:bg-muted/50">
                  <Badge variant="outline">{b.type === "extension" ? "Asked for time" : "Blocked"}</Badge>
                  <span className="flex-1 text-sm"><span className="font-medium">{b.student}</span> asked program staff for help</span>
                </Link></li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Waiting for review" value={queue.length} icon={ClipboardCheck} hint="Target: feedback within 5 business days" />
        <Stat label="Past the target" value={overdue} icon={Clock} hint={overdue ? "Staff get an escalation for these" : "Nothing overdue"} />
        <Stat label="Active mentees" value={mentees.length} icon={Users} />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>To review</CardTitle><CardDescription>Oldest first.</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {queue.sort((a, b) => a.s.createdAt.getTime() - b.s.createdAt.getTime()).map((q) => {
                const days = businessDaysSince(q.s.createdAt);
                return (
                  <li key={q.e.id}>
                    <Link href={`/mentor/review/${q.s.id}`} className="press flex items-center gap-3 p-3 hover:bg-muted/50">
                      <span className="flex-1">
                        <span className="block font-medium">{q.student}</span>
                        <span className="text-sm text-muted-foreground">{q.title} · version {q.s.version}</span>
                      </span>
                      <span className={`text-sm ${days > 5 ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                        {days === 0 ? "today" : `${days} business ${days === 1 ? "day" : "days"}`}
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground" aria-hidden />
                    </Link>
                  </li>
                );
              })}
              {!queue.length && <li className="grid justify-items-center gap-2 p-6 text-center text-muted-foreground"><Inbox className="size-6" />Nothing to review.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Your mentees</CardTitle><CardDescription>Students working on a project with you.</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {mentees.map((m) => (
                <li key={m.e.id} className="flex items-center gap-3 p-3">
                  <span className="flex-1"><span className="block font-medium">{m.student}</span><span className="text-sm text-muted-foreground">{m.title}</span></span>
                  <EnrollmentBadge state={m.e.state} />
                  {m.e.state === "active" && <form action={welcomeAction}><input type="hidden" name="enrollmentId" value={m.e.id} /><Button size="sm" variant="outline">Send welcome</Button></form>}
                  <Button asChild size="sm" variant="ghost"><Link href={`/workspace/${m.e.id}`}>Open</Link></Button>
                </li>
              ))}
              {!mentees.length && <li className="p-6 text-center text-muted-foreground">No active mentees.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <form action={mentorProfileAction}>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">Your mentor profile
                {mp?.verifiedAt ? <Badge>Verified by staff</Badge> : <Badge variant="outline">Not verified yet</Badge>}</CardTitle>
              <CardDescription>{mp?.verificationNote ? `Checked: ${mp.verificationNote}` : "Students see your headline and expertise. Staff verify your affiliation."}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
              <Field label="Headline" name="headline" defaultValue={mp?.headline} placeholder="Reliability engineer, 8 years in pumps" />
              <Field label="Expertise" name="expertise" defaultValue={mp?.expertise.join(", ")} hint="Comma separated." />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Mentees at once" name="capacity" type="number" min={1} max={10} defaultValue={mp?.capacity ?? 3} />
                <SelectField label="Timezone" name="timezone" defaultValue={mp?.timezone ?? "UTC"} options={Intl.supportedValuesOf("timeZone").map((z) => ({ value: z, label: z.replaceAll("_", " ") }))} />
              </div>
              <Button size="sm" variant="secondary" className="justify-self-start">Save profile</Button>
            </CardContent>
          </form>
        </Card>
        <Card>
          <CardHeader><CardTitle>Recently reviewed</CardTitle></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {reviewed.map((r) => (
                <li key={r.a.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                  <span className="flex-1"><span className="font-medium">{r.student}</span> · {r.title}</span>
                  <span className="text-muted-foreground">{when(r.a.createdAt)}</span>
                  <span>{{ accept: "Accepted", revise: "Revision requested", not_complete: "Not completed" }[r.a.decision]}</span>
                </li>
              ))}
              {!reviewed.length && <li className="p-6 text-center text-muted-foreground">No reviews yet.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
