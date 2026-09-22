import Link from "next/link";
import type { ReactNode } from "react";
import { and, asc, count, desc, eq, inArray, isNull, sum } from "drizzle-orm";
import { ArrowRight, BadgeCheck, Building2, CalendarClock, ClipboardCheck, FileText, Inbox, Pencil, ShieldCheck, Sparkles, Target, Trophy, Users } from "lucide-react";
import { progress } from "@iq/core";
import { briefVersions, enrollments, milestones, organizations, projects, savedProjects, studentProfiles, xpTransactions, type Db } from "@iq/db";
import { ProjectCard } from "@/components/project-card";
import { Button, EnrollmentBadge, ListingBadge, when } from "@/components/ui";
import { Progress } from "@/components/ui/progress";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getRoles } from "@/server/authz";
import { listProjects } from "@/server/discovery";
import { expireStaleOffers } from "@/server/enrollments";

type Roles = Awaited<ReturnType<typeof getRoles>>;

export function Stat({ label, value, hint, icon: Icon, href }: { label: string; value: ReactNode; hint?: string; icon: typeof Users; href?: string }) {
  const card = (
    <Card className={href ? "lift h-full gap-2 py-4" : "gap-2 py-4"}>
      <CardHeader className="px-4">
        <CardDescription className="flex items-center justify-between">{label}<Icon className="size-4" aria-hidden /></CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="px-4 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
  return href ? <Link href={href} className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring">{card}</Link> : card;
}

function Section({ title, description, href, cta, children }: { title: string; description?: string; href?: string; cta?: string; children: ReactNode }) {
  return (
    <section className="grid gap-3">
      <div className="flex items-end justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {href && <Button asChild variant="ghost" size="sm"><Link href={href}>{cta} <ArrowRight /></Link></Button>}
      </div>
      {children}
    </section>
  );
}

export async function StudentDashboard({ db, userId }: { db: Db; userId: string }) {
  await expireStaleOffers(db);
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
  const { cards, names, tiers } = await listProjects(db, { id: userId }, { openOnly: true });
  const [[xpRow], [saved]] = await Promise.all([
    db.select({ n: sum(xpTransactions.amount) }).from(xpTransactions).where(eq(xpTransactions.userId, userId)),
    db.select({ n: count() }).from(savedProjects).where(eq(savedProjects.userId, userId)),
  ]);
  const xp = Number(xpRow.n ?? 0);
  const p = progress(xp);
  const mine = await db.select({ e: enrollments, title: briefVersions.title }).from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .where(and(eq(enrollments.studentId, userId), inArray(enrollments.state, ["offered", "active", "submitted", "revision_requested"])))
    .orderBy(desc(enrollments.updatedAt));
  const next = await Promise.all(mine.filter((m) => m.e.state !== "offered").map(async (m) => {
    const [ms] = await db.select().from(milestones).where(and(eq(milestones.enrollmentId, m.e.id), isNull(milestones.doneAt))).orderBy(asc(milestones.dueAt)).limit(1);
    return { ...m, ms };
  }));
  const offers = mine.filter((m) => m.e.state === "offered");
  const verified = Object.values(tiers).filter((t) => t !== "none").length;
  return (
    <>
      {offers.map((o) => (
        <Link key={o.e.id} href="/quests" className="press flex items-center gap-3 rounded-xl border border-primary/50 bg-primary/5 p-4 hover:bg-primary/10">
          <Inbox className="size-5 text-primary" />
          <span className="flex-1"><span className="font-medium">You have an offer: {o.title}</span>
            <span className="block text-sm text-muted-foreground">Reply by {when(o.e.offerExpiresAt, profile.timezone, true)}</span></span>
          <ArrowRight className="size-4" />
        </Link>
      ))}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Link href="/profile" className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
          <Card className="lift h-full gap-2 py-4">
            <CardHeader className="px-4">
              <CardDescription className="flex items-center justify-between">Level {p.level}<Trophy className="size-4" /></CardDescription>
              <CardTitle className="text-2xl tabular-nums">{xp} XP</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-1.5 px-4">
              <Progress value={((xp - p.levelStart) / (p.nextLevelAt - p.levelStart)) * 100} aria-label={`${p.nextLevelAt - xp} XP to level ${p.level + 1}`} />
              <span className="text-xs text-muted-foreground">{p.nextLevelAt - xp} XP to level {p.level + 1}</span>
            </CardContent>
          </Card>
        </Link>
        <Stat label="Active quests" href="/quests" value={next.length} icon={Target} hint={offers.length ? `${offers.length} offer waiting` : undefined} />
        <Stat label="Verified skills" href="/profile?tab=skills" value={verified} icon={BadgeCheck} hint={verified ? Object.entries(tiers).filter(([, t]) => t !== "none").map(([id, t]) => `${names[id]} (${t})`).join(", ") : "Earned from reviewed work"} />
        <Stat label="Saved projects" href="/explore?saved=on" value={saved.n} icon={FileText} />
      </div>
      {next.length > 0 && (
        <Section title="Continue where you left off" href="/quests" cta="My quests">
          <div className="grid gap-4 md:grid-cols-2">
            {next.map((n) => (
              <Card key={n.e.id} className="lift">
                <CardHeader>
                  <CardTitle className="text-base">{n.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5">
                    <CalendarClock className="size-3.5" />
                    {n.e.state === "submitted" ? "Waiting for your mentor's review" : n.ms ? `Next: ${n.ms.title}, due ${when(n.ms.dueAt, profile.timezone)}` : "All milestones done. Time to submit."}
                  </CardDescription>
                  <CardAction><EnrollmentBadge state={n.e.state} /></CardAction>
                </CardHeader>
                <CardContent><Button asChild size="sm"><Link href={`/workspace/${n.e.id}`}>Open workspace <ArrowRight /></Link></Button></CardContent>
              </Card>
            ))}
          </div>
        </Section>
      )}
      <Section title="Recommended for you" description="Chosen from your interests, weekly time and skill evidence." href="/explore" cta="Explore all">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.filter((c) => !c.myState && !c.dismissed).slice(0, 3).map((c) => <ProjectCard key={c.id} c={c} names={names} tiers={tiers} back="/" dismissable />)}
        </div>
        <p className="text-sm text-muted-foreground">
          Suggestions look off? <Link href="/profile?tab=details" className="text-primary underline-offset-4 hover:underline">Update your interests and hours</Link>.
        </p>
      </Section>
    </>
  );
}

export async function OwnerDashboard({ db, roles }: { db: Db; roles: Roles }) {
  const rows = await db.select({ id: projects.id, state: projects.state, title: briefVersions.title, org: organizations.name, note: projects.reviewNote, verified: organizations.verifiedAt })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(inArray(projects.orgId, roles.ownerOf)).orderBy(desc(projects.updatedAt));
  const by = (s: string) => rows.filter((r) => r.state === s).length;
  const [applicants] = rows.length ? await db.select({ n: count() }).from(enrollments)
    .where(and(inArray(enrollments.projectId, rows.map((r) => r.id)), eq(enrollments.state, "applied"))) : [{ n: 0 }];
  const attention = rows.filter((r) => r.state === "changes_requested" || r.state === "draft");
  return (
    <>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat label="Applicants waiting" value={applicants.n} icon={Inbox} hint="Open a live brief to review them" />
        <Stat label="Published" value={by("published")} icon={Building2} />
        <Stat label="In staff review" value={by("in_review")} icon={ShieldCheck} />
        <Stat label="Changes requested" value={by("changes_requested")} icon={Pencil} />
        <Stat label="Drafts" value={by("draft")} icon={FileText} />
      </div>
      <Section title="Needs your attention" description="Drafts to finish and briefs staff sent back." href="/company" cta="All projects">
        <Card className="py-0">
          <ul className="divide-y">
            {attention.map((r) => (
              <li key={r.id}>
                <Link href={`/company/projects/${r.id}`} className="press flex items-center gap-3 p-4 hover:bg-muted/50">
                  <span className="flex-1">
                    <span className="block font-medium">{r.title || "Untitled draft"}</span>
                    <span className="text-sm text-muted-foreground">{r.note ?? r.org}</span>
                  </span>
                  <ListingBadge state={r.state} />
                </Link>
              </li>
            ))}
            {!attention.length && <li className="p-6 text-center text-muted-foreground">Nothing waiting on you.</li>}
          </ul>
        </Card>
      </Section>
    </>
  );
}

export async function MentorDashboard({ db, userId }: { db: Db; userId: string }) {
  const rows = await db.select({ id: projects.id, state: projects.state, title: briefVersions.title, tier: briefVersions.tier, org: organizations.name })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(and(eq(briefVersions.mentorId, userId), inArray(projects.state, ["published", "paused"])));
  const mine = await db.select({ state: enrollments.state }).from(enrollments)
    .where(and(eq(enrollments.mentorId, userId), inArray(enrollments.state, ["active", "submitted", "revision_requested"])));
  const waiting = mine.filter((m) => m.state === "submitted").length;
  return (
    <Section title="Mentoring" href="/mentor" cta="Open review queue">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Waiting for your review" value={waiting} icon={ClipboardCheck} hint="Target: feedback within 5 business days" />
        <Stat label="Active mentees" value={mine.length - waiting} icon={Users} />
        <Stat label="Live projects you mentor" value={rows.length} icon={Building2} />
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {rows.map((r) => (
          <Card key={r.id}>
            <CardHeader>
              <CardDescription>{r.org} · {r.tier}</CardDescription>
              <CardTitle className="text-base"><Link href={`/projects/${r.id}`} className="hover:underline">{r.title}</Link></CardTitle>
              <CardAction><ListingBadge state={r.state} /></CardAction>
            </CardHeader>
          </Card>
        ))}
      </div>
    </Section>
  );
}

export async function StaffDashboard({ db }: { db: Db }) {
  const [[review], [orgs], [live], [students]] = await Promise.all([
    db.select({ n: count() }).from(projects).where(eq(projects.state, "in_review")),
    db.select({ n: count() }).from(organizations).where(isNull(organizations.verifiedAt)),
    db.select({ n: count() }).from(projects).where(eq(projects.state, "published")),
    db.select({ n: count() }).from(studentProfiles),
  ]);
  return (
    <Section title="Program operations" href="/staff" cta="Open staff queue">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Briefs to review" value={review.n} icon={ClipboardCheck} hint="Quality gate before publishing" />
        <Stat label="Organizations to verify" value={orgs.n} icon={ShieldCheck} />
        <Stat label="Live projects" value={live.n} icon={Building2} />
        <Stat label="Students" value={students.n} icon={Users} />
      </div>
    </Section>
  );
}
