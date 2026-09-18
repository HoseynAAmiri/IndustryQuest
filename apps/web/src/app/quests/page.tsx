import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq, sql } from "drizzle-orm";
import { ArrowRight, CalendarClock, Compass, Inbox, Target, Trophy } from "lucide-react";
import { briefVersions, enrollments, organizations, projects, studentProfiles, user } from "@iq/db";
import { Alert, Button, CheckField, EnrollmentBadge, Page, messages, when } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { expireStaleOffers } from "@/server/enrollments";
import { issuePendingFor } from "@/server/rewards";
import { respond, withdrawAction } from "./actions";

export const metadata: Metadata = { title: "My quests" };

export default async function Quests({ searchParams }: PageProps<"/quests">) {
  const me = await requireUser();
  const db = getDb();
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!profile) redirect("/onboarding");
  const { error, info } = await messages(searchParams);
  await expireStaleOffers(db);
  await issuePendingFor(db, me.id);
  const rows = await db.select({ e: enrollments, v: briefVersions, org: organizations.name, mentor: user.name })
    .from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    // Offers have no mentor on the enrollment yet; fall back to the one named in the brief.
    .leftJoin(user, eq(user.id, sql`coalesce(${enrollments.mentorId}, ${briefVersions.mentorId})`))
    .where(eq(enrollments.studentId, me.id)).orderBy(desc(enrollments.updatedAt));
  const tz = profile.timezone;
  const pick = (...s: string[]) => rows.filter((r) => s.includes(r.e.state));
  const offers = pick("offered");
  const active = pick("active", "submitted", "revision_requested");
  const applied = pick("applied");
  const done = pick("completed");
  const closed = pick("declined", "withdrawn", "offer_declined", "offer_expired", "closed_incomplete");

  const Empty = ({ icon: Icon, text }: { icon: typeof Inbox; text: string }) => (
    <Card><CardContent className="grid justify-items-center gap-3 py-10 text-center text-muted-foreground">
      <Icon className="size-8" aria-hidden /><p>{text}</p>
      <Button asChild variant="outline" size="sm"><Link href="/explore"><Compass /> Explore projects</Link></Button>
    </CardContent></Card>
  );

  const Row = ({ r, children }: { r: (typeof rows)[number]; children?: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardDescription>{r.org} · {r.v.tier} · {r.v.xp} XP on completion</CardDescription>
        <CardTitle className="text-base"><Link href={`/projects/${r.e.projectId}`} className="hover:underline">{r.v.title}</Link></CardTitle>
        <CardAction><EnrollmentBadge state={r.e.state} /></CardAction>
      </CardHeader>
      {children}
    </Card>
  );

  return (
    <Page title="My quests" description="Applications, offers, work in progress and finished projects.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>

      {offers.map((r) => (
        <Card key={r.e.id} className="mb-6 border-primary/50 bg-primary/5">
          <form action={respond}>
            <CardHeader>
              <CardDescription>Offer from {r.org}</CardDescription>
              <CardTitle>{r.v.title}</CardTitle>
              <CardAction><EnrollmentBadge state="offered" /></CardAction>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4 text-sm">
              <p className="flex items-center gap-2 font-medium"><CalendarClock className="size-4" /> Reply by {when(r.e.offerExpiresAt, tz, true)}. After that the place goes back to the company.</p>
              <ul className="grid gap-1 text-muted-foreground">
                <li>Mentor: {r.mentor} · Effort about {r.v.content.effortHours} hours · Brief version {r.v.version}</li>
                <li>Rubric: {r.v.content.rubric.map((c) => c.name).join(", ")}</li>
                <li>Reward on accepted completion: {r.v.xp} XP. This rule is fixed when you accept.</li>
              </ul>
              <input type="hidden" name="enrollmentId" value={r.e.id} />
              <CheckField name="agreed" label="I've read the brief, rubric and terms, and I agree to them." />
            </CardContent>
            <CardFooter className="mt-4 gap-2">
              <Button name="decision" value="accept">Accept offer</Button>
              <Button name="decision" value="decline" variant="outline">Decline</Button>
              <Button asChild variant="ghost"><Link href={`/projects/${r.e.projectId}`}>Read the brief again</Link></Button>
            </CardFooter>
          </form>
        </Card>
      ))}

      <Tabs defaultValue={active.length ? "active" : applied.length ? "applied" : "done"}>
        <TabsList>
          <TabsTrigger value="active">In progress ({active.length})</TabsTrigger>
          <TabsTrigger value="applied">Applications ({applied.length})</TabsTrigger>
          <TabsTrigger value="done">Completed ({done.length})</TabsTrigger>
          <TabsTrigger value="closed">Closed ({closed.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="active" className="mt-4 grid gap-4">
          {active.map((r) => (
            <Row key={r.e.id} r={r}>
              <CardFooter className="justify-between gap-2">
                <span className="text-sm text-muted-foreground">Mentor: {r.mentor}</span>
                <Button asChild size="sm"><Link href={`/workspace/${r.e.id}`}>Open workspace <ArrowRight /></Link></Button>
              </CardFooter>
            </Row>
          ))}
          {!active.length && <Empty icon={Target} text="No projects in progress. Accepted offers show up here." />}
        </TabsContent>
        <TabsContent value="applied" className="mt-4 grid gap-4">
          {applied.map((r) => (
            <Row key={r.e.id} r={r}>
              <CardFooter className="justify-between gap-2">
                <span className="text-sm text-muted-foreground">Sent {when(r.e.createdAt, tz)}. The company decides by its published criteria.</span>
                <form action={withdrawAction}>
                  <input type="hidden" name="enrollmentId" value={r.e.id} />
                  <Button size="sm" variant="ghost">Withdraw</Button>
                </form>
              </CardFooter>
            </Row>
          ))}
          {!applied.length && <Empty icon={Inbox} text="No open applications." />}
        </TabsContent>
        <TabsContent value="done" className="mt-4 grid gap-4">
          {done.map((r) => (
            <Row key={r.e.id} r={r}>
              <CardFooter className="justify-between gap-2">
                <span className="text-sm text-muted-foreground">
                  {r.e.rewardsStatus === "pending" ? "Review accepted. Credentials are being issued." : `Completed ${when(r.e.completedAt, tz)} · ${r.v.xp} XP earned`}
                </span>
                <Button asChild size="sm" variant="outline"><Link href={`/workspace/${r.e.id}`}>View record</Link></Button>
              </CardFooter>
            </Row>
          ))}
          {!done.length && <Empty icon={Trophy} text="Finished projects and their verified records appear here." />}
        </TabsContent>
        <TabsContent value="closed" className="mt-4 grid gap-4">
          {closed.map((r) => (
            <Row key={r.e.id} r={r}>
              {r.e.decisionNote && <CardContent className="text-sm text-muted-foreground">Company note: {r.e.decisionNote}</CardContent>}
            </Row>
          ))}
          {!closed.length && <Empty icon={Inbox} text="Nothing here. Declined, withdrawn or expired items are kept private to you." />}
        </TabsContent>
      </Tabs>
    </Page>
  );
}
