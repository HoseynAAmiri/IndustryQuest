import Link from "next/link";
import { notFound } from "next/navigation";
import { and, desc, eq } from "drizzle-orm";
import { Bookmark, BookmarkCheck, CircleCheck, Compass, Lock } from "lucide-react";
import { checkEligibility, explainFit } from "@iq/core";
import { enrollments, savedProjects, studentProfiles, user } from "@iq/db";
import { toggleSave } from "@/app/explore/actions";
import { BriefView } from "@/components/brief-view";
import { availability } from "@/components/project-card";
import { Alert, Button, ENROLLMENT, EnrollmentBadge, Page, TextArea, messages } from "@/components/ui";
import { openCaseAction } from "@/app/support/actions";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { eligibilityTiers, seatsTaken, skillNames } from "@/server/discovery";
import { loadProject } from "@/server/projects";

const TIER_NAME = { emerging: "Emerging", bronze: "Bronze", none: "no evidence yet" } as const;

export default async function ProjectPage({ params, searchParams }: PageProps<"/projects/[id]">) {
  const { id } = await params;
  const { error } = await messages(searchParams);
  const db = getDb();
  const row = await loadProject(db, id).catch(() => null);
  if (!row) notFound();
  const { project, brief, org } = row;
  const session = await getSession();
  const roles = session ? await getRoles(db, session.user.id) : null;
  const insider = !!roles && (roles.isStaff || roles.ownerOf.includes(project.orgId) || brief.mentorId === session!.user.id);
  // Drafts and briefs in review are private to the company and staff (ACC-08 covers public briefs only).
  if (!["published", "paused", "closed"].includes(project.state) && !insider) notFound();

  const b = brief.content;
  const names = await skillNames(db);
  const [mentor] = brief.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, brief.mentorId)) : [];
  const open = Math.max(0, brief.capacity - ((await seatsTaken(db, [id])).get(id) ?? 0));
  const avail = availability(project.state, open, brief.capacity);

  const [profile] = session ? await db.select().from(studentProfiles).where(eq(studentProfiles.userId, session.user.id)) : [];
  const tiers = profile ? await eligibilityTiers(db, session!.user.id) : {};
  const elig = checkEligibility(b.prerequisites, tiers);
  const fit = profile && explainFit(
    { interests: profile.interests, weeklyHours: profile.weeklyHours, tiers },
    { text: `${b.title} ${b.summary}`, skills: b.skillIds.map((s) => ({ id: s, name: names[s] ?? s })), effortHours: b.effortHours, beginner: b.beginner, prerequisites: b.prerequisites },
  );
  const [mine] = profile ? await db.select().from(enrollments)
    .where(and(eq(enrollments.projectId, id), eq(enrollments.studentId, session!.user.id))).orderBy(desc(enrollments.createdAt)).limit(1) : [];
  const live = mine && ["applied", "offered", "active", "submitted", "revision_requested", "completed"].includes(mine.state);
  const canApply = !!profile && !live && project.state === "published" && open > 0 && elig.eligible;
  const [saved] = profile ? await db.select().from(savedProjects).where(and(eq(savedProjects.userId, session!.user.id), eq(savedProjects.projectId, id))) : [];

  return (
    <Page title={b.title} description={<Link href={`/companies/${org.id}`} className="hover:underline">{org.name}{org.verifiedAt && " · verified"}</Link>} back={{ href: "/explore", label: "Explore projects" }}
      actions={insider && project.state !== "published" ? <Badge variant="secondary">Preview: {project.state.replace("_", " ")}</Badge> : undefined}>
      <div className="mb-4 grid gap-3"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <div className="order-2 lg:order-1">
          <p className="mb-6 text-lg text-muted-foreground">{b.summary}</p>
          <BriefView b={b} orgName={org.name} mentorName={mentor?.name} skillNames={names} restricted />
        </div>

        <aside className="order-1 grid h-fit gap-4 lg:sticky lg:top-20 lg:order-2" aria-label="Availability and eligibility">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                {avail.tone === "default" ? <CircleCheck className="size-5 text-green-600" /> : <Lock className="size-5 text-muted-foreground" />}
                {avail.label}
              </CardTitle>
              <CardDescription>
                {project.state === "published" ? `Apply by ${b.applyDeadline} (UTC). Applying needs a short note, never unpaid trial work.`
                  : project.state === "paused" ? "The company paused new applications. Save it to find it again when it reopens."
                  : "This project no longer takes applications. Students already in it keep going."}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-2">
              {!session && <Button asChild><Link href="/sign-in">Sign in to apply</Link></Button>}
              {canApply && <Button asChild><Link href={`/projects/${id}/apply`}>Apply</Link></Button>}
              {live && (
                <div className="grid gap-2 rounded-lg border p-3 text-sm">
                  <span className="flex items-center justify-between">Your status <EnrollmentBadge state={mine.state} /></span>
                  <Button asChild size="sm" variant="secondary">
                    <Link href={["applied", "offered"].includes(mine.state) ? "/quests" : `/workspace/${mine.id}`}>
                      {["applied", "offered"].includes(mine.state) ? "See in My quests" : "Open workspace"}
                    </Link>
                  </Button>
                </div>
              )}
              {mine && !live && <p className="text-sm text-muted-foreground">Last application: {ENROLLMENT[mine.state][0].toLowerCase()}. You can apply again.</p>}
              {profile && (
                <form action={toggleSave}>
                  <input type="hidden" name="projectId" value={id} />
                  <input type="hidden" name="back" value={`/projects/${id}`} />
                  <Button variant="outline" className="w-full" aria-pressed={!!saved}>
                    {saved ? <><BookmarkCheck className="text-primary" /> Saved</> : <><Bookmark /> Save for later</>}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {profile && (
            <Card className={elig.eligible ? undefined : "border-amber-500/50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  {elig.eligible ? <><CircleCheck className="size-5 text-green-600" /> You meet the requirements</> : <><Lock className="size-5 text-amber-600" /> Not unlocked yet</>}
                </CardTitle>
                <CardDescription>Eligibility depends on reviewed skill evidence only. XP and level never count.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                {elig.missing.map((m) => (
                  <div key={m.skillId} className="grid gap-2 rounded-lg border p-3">
                    <p>
                      Needs <strong>{TIER_NAME[m.minTier]}</strong> in {names[m.skillId]}. You have {TIER_NAME[m.have]}.
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <Button asChild size="sm" variant="secondary">
                        <Link href={`/explore?skill=${m.skillId}&beginner=on`}><Compass /> Projects that build it</Link>
                      </Button>
                    </div>
                    <details className="text-sm">
                      <summary className="cursor-pointer text-primary">Already have this skill? Ask for an equivalency review</summary>
                      <form action={openCaseAction} className="mt-2 grid gap-2">
                        <input type="hidden" name="type" value="equivalency" />
                        <input type="hidden" name="skillId" value={m.skillId} />
                        <TextArea label="Your evidence" name="summary" rows={3} required minLength={10} hint="Jobs, courses or work samples staff can check. If accepted, it unlocks projects but isn't a platform credential." />
                        <Button size="sm" variant="secondary" className="justify-self-start">Send for review</Button>
                      </form>
                    </details>
                  </div>
                ))}
                {fit && fit.reasons.length > 0 && (
                  <div>
                    <p className="mb-1.5 font-medium">Why it could suit you</p>
                    <ul className="grid gap-1.5 text-muted-foreground">
                      {fit.reasons.map((r) => <li key={r} className="flex items-baseline gap-2"><span className="size-1.5 shrink-0 translate-y-[-2px] rounded-full bg-primary" aria-hidden />{r}</li>)}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </aside>
      </div>
    </Page>
  );
}
