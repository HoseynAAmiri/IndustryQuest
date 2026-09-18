import Link from "next/link";
import type { ReactNode } from "react";
import { and, count, desc, eq, inArray, isNull } from "drizzle-orm";
import { ArrowRight, Building2, ClipboardCheck, FileText, Pencil, ShieldCheck, Sparkles, Users } from "lucide-react";
import { briefVersions, organizations, projects, savedProjects, studentProfiles, type Db } from "@iq/db";
import { ProjectCard } from "@/components/project-card";
import { Button, ListingBadge } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { getRoles } from "@/server/authz";
import { listProjects } from "@/server/discovery";

type Roles = Awaited<ReturnType<typeof getRoles>>;

export function Stat({ label, value, hint, icon: Icon }: { label: string; value: ReactNode; hint?: string; icon: typeof Users }) {
  return (
    <Card className="gap-2 py-4">
      <CardHeader className="px-4">
        <CardDescription className="flex items-center justify-between">{label}<Icon className="size-4" aria-hidden /></CardDescription>
        <CardTitle className="text-2xl tabular-nums">{value}</CardTitle>
      </CardHeader>
      {hint && <CardContent className="px-4 text-xs text-muted-foreground">{hint}</CardContent>}
    </Card>
  );
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
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, userId));
  const { cards, names, tiers } = await listProjects(db, { id: userId }, { openOnly: true });
  const [saved] = await db.select({ n: count() }).from(savedProjects).where(eq(savedProjects.userId, userId));
  const eligible = cards.filter((c) => c.fit?.eligible).length;
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="Open projects you can join" value={eligible} icon={Sparkles} hint={`${cards.length - eligible} more unlock with skill evidence`} />
        <Stat label="Saved projects" value={saved.n} icon={FileText} />
        <Stat label="Hours a week" value={profile.weeklyHours || "Not set"} icon={Users} hint={profile.interests.length ? `Interests: ${profile.interests.join(", ")}` : "Add interests for better suggestions"} />
      </div>
      <Section title="Recommended for you" description="Chosen from your interests, weekly time and skill evidence." href="/explore" cta="Explore all">
        <div className="grid gap-4 md:grid-cols-3">
          {cards.slice(0, 3).map((c) => <ProjectCard key={c.id} c={c} names={names} tiers={tiers} back="/" />)}
        </div>
        <p className="text-sm text-muted-foreground">
          Suggestions look off? <Link href="/onboarding" className="text-primary underline-offset-4 hover:underline">Update your interests and hours</Link>.
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
  const attention = rows.filter((r) => r.state === "changes_requested" || r.state === "draft");
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-4">
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
                <Link href={`/company/projects/${r.id}`} className="flex items-center gap-3 p-4 hover:bg-muted/50">
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
    .where(and(eq(briefVersions.mentorId, userId), inArray(projects.state, ["published", "paused", "in_review"])));
  return (
    <Section title="Projects you mentor" description="You're the named mentor on these briefs.">
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
      <div className="grid gap-4 sm:grid-cols-4">
        <Stat label="Briefs to review" value={review.n} icon={ClipboardCheck} hint="Quality gate before publishing" />
        <Stat label="Organizations to verify" value={orgs.n} icon={ShieldCheck} />
        <Stat label="Live projects" value={live.n} icon={Building2} />
        <Stat label="Students" value={students.n} icon={Users} />
      </div>
    </Section>
  );
}
