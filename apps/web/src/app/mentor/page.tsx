import type { Metadata } from "next";
import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ArrowRight, ClipboardCheck, Clock, Inbox, Users } from "lucide-react";
import { assessments, briefVersions, enrollments, submissions, user } from "@iq/db";
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
  const { error, info } = await messages(searchParams);
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
  const mentees = mine.filter((m) => m.e.state !== "submitted" && m.e.state !== "completed");
  const overdue = queue.filter((q) => businessDaysSince(q.s.createdAt) > 5).length;

  return (
    <Page title="Review queue" description="Submissions waiting for you, and the students you support.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
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
                  <Button asChild size="sm" variant="ghost"><Link href={`/workspace/${m.e.id}`}>Open</Link></Button>
                </li>
              ))}
              {!mentees.length && <li className="p-6 text-center text-muted-foreground">No active mentees.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
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
