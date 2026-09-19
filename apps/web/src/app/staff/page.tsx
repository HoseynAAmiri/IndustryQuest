import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq, isNull } from "drizzle-orm";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { briefVersions, mentorProfiles, organizations, projects, user } from "@iq/db";
import { Alert, Button, Field, Page, messages, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { mentorCoverage, runEscalations } from "@/server/staff";
import { verify, verifyMentorAction } from "./actions";

export const metadata: Metadata = { title: "Staff queue" };

function Queue({ title, count, description, children, id }: { title: string; count: number; description?: string; children: React.ReactNode; id?: string }) {
  return (
    <Card id={id}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">{title} <Badge variant={count ? "default" : "secondary"}>{count}</Badge></CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent><ul className="divide-y rounded-lg border">{children}</ul></CardContent>
    </Card>
  );
}
const Empty = ({ text }: { text: string }) => <li className="p-5 text-center text-sm text-muted-foreground">{text}</li>;

export default async function Staff({ searchParams }: PageProps<"/staff">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Staff"><Alert>Staff only.</Alert></Page>;
  const { error } = await messages(searchParams);
  const { lateReviews, lateMilestones } = await runEscalations(db);
  const { unconfirmed, mentors } = await mentorCoverage(db);
  const orgs = await db.select().from(organizations).where(isNull(organizations.verifiedAt)).orderBy(asc(organizations.createdAt));
  const unverifiedMentors = await db.select({ id: user.id, name: user.name, headline: mentorProfiles.headline }).from(mentorProfiles)
    .innerJoin(user, eq(user.id, mentorProfiles.userId)).where(isNull(mentorProfiles.verifiedAt));
  const queue = await db.select({ id: projects.id, title: briefVersions.title, tier: briefVersions.tier, org: organizations.name, since: projects.updatedAt })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(projects.state, "in_review")).orderBy(asc(projects.updatedAt));

  return (
    <Page title="Staff queue" description="What needs a person today. Mentors and staff are reminded automatically; this is the list to act on.">
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Queue id="attention" title="Needs attention" count={lateReviews.length + lateMilestones.length}
          description="Reviews past the 5-business-day target and overdue milestones. The student is never penalised for a late review.">
          {lateReviews.map((r) => (
            <li key={r.s.id}>
              <Link href={`/workspace/${r.e.id}`} className="press flex items-center gap-3 p-3 hover:bg-muted/50">
                <span className="flex-1"><span className="block font-medium">Review overdue: {r.student}</span>
                  <span className="text-sm text-muted-foreground">{r.title} · submitted {when(r.s.createdAt)}</span></span>
                <Badge variant="destructive">Escalated</Badge>
              </Link>
            </li>
          ))}
          {lateMilestones.map((r) => (
            <li key={r.m.id}>
              <Link href={`/workspace/${r.e.id}`} className="press flex items-center gap-3 p-3 hover:bg-muted/50">
                <span className="flex-1"><span className="block font-medium">Milestone overdue: {r.student}</span>
                  <span className="text-sm text-muted-foreground">{r.m.title} · was due {when(r.m.dueAt)}</span></span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
          {!lateReviews.length && !lateMilestones.length && <Empty text="Nothing overdue." />}
        </Queue>

        <Queue title="Briefs waiting for review" count={queue.length} description="Oldest first.">
          {queue.map((q) => (
            <li key={q.id}>
              <Link href={`/staff/projects/${q.id}`} className="press flex items-center gap-3 p-3 hover:bg-muted/50">
                <span className="flex-1"><span className="block font-medium">{q.title}</span>
                  <span className="text-sm text-muted-foreground">{q.org} · {q.tier} · submitted {when(q.since)}</span></span>
                <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
              </Link>
            </li>
          ))}
          {!queue.length && <Empty text="Nothing to review." />}
        </Queue>

        <Queue title="Mentor coverage" count={unconfirmed.length}
          description="Briefs without a confirmed mentor, and each mentor's load against the capacity they gave.">
          {unconfirmed.map((u) => (
            <li key={u.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1 font-medium">{u.title}</span><Badge variant="outline">Mentor not confirmed</Badge>
            </li>
          ))}
          {mentors.map((m) => (
            <li key={m.id} className="flex items-center gap-3 p-3 text-sm">
              <span className="flex-1">{m.name}{!m.verifiedAt && <span className="text-muted-foreground"> · not verified</span>}</span>
              <span className={m.active >= m.capacity ? "font-medium text-destructive" : "text-muted-foreground"}>{m.active} of {m.capacity} mentees</span>
            </li>
          ))}
        </Queue>

        <Queue title="People and organizations to verify" count={orgs.length + unverifiedMentors.length}
          description="Check outside the platform first, then note what you checked. The note is shown with the verified badge.">
          {orgs.map((o) => (
            <li key={o.id} className="grid gap-2 p-3">
              <span className="font-medium">{o.name} <span className="font-normal text-muted-foreground">· organization</span></span>
              <form action={verify} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="orgId" value={o.id} />
                <div className="min-w-48 flex-1"><Field label="What you checked" name="note" placeholder="Company register entry and contact's work email" required /></div>
                <Button size="sm" variant="outline"><BadgeCheck /> Verify</Button>
              </form>
            </li>
          ))}
          {unverifiedMentors.map((m) => (
            <li key={m.id} className="grid gap-2 p-3">
              <span className="font-medium">{m.name} <span className="font-normal text-muted-foreground">· mentor · {m.headline}</span></span>
              <form action={verifyMentorAction} className="flex flex-wrap items-end gap-2">
                <input type="hidden" name="userId" value={m.id} />
                <div className="min-w-48 flex-1"><Field label="What you checked" name="note" placeholder="Employment confirmed with the company owner" required /></div>
                <Button size="sm" variant="outline"><BadgeCheck /> Verify</Button>
              </form>
            </li>
          ))}
          {!orgs.length && !unverifiedMentors.length && <Empty text="No one waiting." />}
        </Queue>
      </div>
    </Page>
  );
}
