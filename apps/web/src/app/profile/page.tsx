import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { asc, desc, eq } from "drizzle-orm";
import { Award, BadgeCheck, Eye, EyeOff, Medal, Trash2, Trophy } from "lucide-react";
import { progress, tierFor } from "@iq/core";
import {
  briefVersions, credentials, enrollments, equivalencies, organizations, projects, skillClaims, skillEvidence, skills, studentProfiles, xpTransactions,
} from "@iq/db";
import { Stat } from "@/app/dashboard";
import { Alert, Button, Field, Page, SelectField, TextArea, messages, when } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { CLAIM_LEVELS } from "@/server/profile";
import { issuePendingFor } from "@/server/rewards";
import { ConfirmSubmit } from "@/components/confirm";
import { saveProfileAction, shareAction, skillAction } from "./actions";

export const metadata: Metadata = { title: "Profile" };

const TABS = ["progress", "skills", "credentials", "details"] as const;
const KIND = { completion: Trophy, achievement: Medal, skill_tier: Award } as const;
const TIER = { emerging: "Emerging", bronze: "Bronze" } as const;
const LEVEL_OPTIONS = Object.entries(CLAIM_LEVELS).map(([value, label]) => ({ value, label }));
const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");

// Everything about the student lives here, one tab per concern: progress, skills, credentials, details.
export default async function Profile({ searchParams }: PageProps<"/profile">) {
  const me = await requireUser();
  const db = getDb();
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!profile) redirect("/onboarding");
  const { error } = await messages(searchParams);
  const requested = String((await searchParams).tab ?? "");
  const tab = (TABS as readonly string[]).includes(requested) ? requested : "progress";
  await issuePendingFor(db, me.id);
  const tz = profile.timezone;

  const [ledger, creds, evidence, claims, allSkills, eqs] = await Promise.all([
    db.select().from(xpTransactions).where(eq(xpTransactions.userId, me.id)).orderBy(desc(xpTransactions.createdAt)),
    db.select().from(credentials).where(eq(credentials.userId, me.id)).orderBy(desc(credentials.issuedAt)),
    db.select({ ev: skillEvidence, project: briefVersions.title, org: organizations.name })
      .from(skillEvidence)
      .innerJoin(enrollments, eq(enrollments.id, skillEvidence.enrollmentId))
      .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
      .innerJoin(projects, eq(projects.id, enrollments.projectId))
      .innerJoin(organizations, eq(organizations.id, projects.orgId))
      .where(eq(skillEvidence.userId, me.id)).orderBy(desc(skillEvidence.createdAt)),
    db.select().from(skillClaims).where(eq(skillClaims.userId, me.id)),
    db.select().from(skills).orderBy(asc(skills.name)),
    db.select().from(equivalencies).where(eq(equivalencies.userId, me.id)),
  ]);
  const xp = ledger.reduce((n, t) => n + t.amount, 0);
  const p = progress(xp);

  // One row per skill the student has any connection to: reviewed evidence, a self-report, or both.
  const rows = allSkills.map((s) => {
    const ev = evidence.filter((e) => e.ev.skillId === s.id);
    return { ...s, ev, tier: tierFor(ev.filter((e) => !e.ev.revokedAt).map((e) => e.ev)), claim: claims.find((c) => c.skillId === s.id), eq: eqs.find((q) => q.skillId === s.id) };
  }).filter((r) => r.ev.length || r.claim || r.eq)
    .sort((a, b) => b.ev.length - a.ev.length || a.name.localeCompare(b.name));
  const unlisted = allSkills.filter((s) => !rows.some((r) => r.id === s.id));
  const verified = rows.filter((r) => r.tier !== "none").length;

  return (
    <Page title="Profile" description="Your progress, skills and records. Private unless you share a credential.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert></div>

      <Card className="mb-6">
        <CardHeader className="flex flex-wrap items-center gap-4">
          <Avatar className="size-14"><AvatarFallback className="bg-primary/10 text-lg text-primary">{initials(me.name)}</AvatarFallback></Avatar>
          <div className="min-w-0 flex-1">
            <CardTitle className="text-xl">{me.name}</CardTitle>
            <CardDescription>{[profile.pronouns, profile.discipline].filter(Boolean).join(" · ") || me.email}</CardDescription>
            {profile.bio && <p className="mt-1 text-sm text-muted-foreground">{profile.bio}</p>}
          </div>
          <div className="w-full sm:w-56">
            <div className="mb-1 flex items-baseline justify-between text-sm">
              <span className="font-medium">Level {p.level}</span><span className="tabular-nums text-muted-foreground">{xp} XP</span>
            </div>
            <Progress value={((xp - p.levelStart) / (p.nextLevelAt - p.levelStart)) * 100} aria-label={`${p.nextLevelAt - xp} XP to level ${p.level + 1}`} />
          </div>
        </CardHeader>
      </Card>

      <Tabs defaultValue={tab}>
        <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <TabsList className="w-max">
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="skills">Skills ({rows.length})</TabsTrigger>
            <TabsTrigger value="credentials">Credentials ({creds.length})</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="progress" className="mt-4 grid gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <Stat label="Verified projects" value={creds.filter((c) => c.kind === "completion").length} icon={Trophy} />
            <Stat label="Verified skills" value={verified} icon={BadgeCheck} />
            <Stat label="Achievements" value={creds.filter((c) => c.kind === "achievement").length} icon={Medal} />
          </div>
          <Card>
            <CardHeader>
              <CardTitle>XP history</CardTitle>
              <CardDescription>
                {p.nextLevelAt - xp} XP to level {p.level + 1}. XP counts accepted project work. It shows how much you've done,
                not how good you are at a skill, and it never unlocks a project by itself.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead className="text-right">XP</TableHead></TableRow></TableHeader>
                <TableBody>
                  {ledger.map((t) => (
                    <TableRow key={t.id}>
                      <TableCell>{when(t.createdAt, tz)}</TableCell>
                      <TableCell className="whitespace-normal">{t.reason}{t.kind === "correction" && " (correction)"}</TableCell>
                      <TableCell className="text-right tabular-nums">{t.amount > 0 ? `+${t.amount}` : t.amount}</TableCell>
                    </TableRow>
                  ))}
                  {!ledger.length && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground">No XP yet. Your first accepted project adds some.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="skills" className="mt-4 grid gap-4">
          <p className="max-w-prose text-sm text-muted-foreground">
            A <strong className="text-foreground">verified</strong> tier comes from mentor-reviewed work: Emerging after one project scored 3 or 4,
            Bronze after two projects with two reviewers. What you add yourself stays marked <strong className="text-foreground">self-reported</strong>.
            It helps companies read your application but doesn't unlock projects.
          </p>
          {rows.map((r) => (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="text-base">{r.name}</CardTitle>
                <CardAction className="flex flex-wrap justify-end gap-1.5">
                  {r.tier !== "none" && <Badge className="gap-1"><BadgeCheck className="size-3" />{TIER[r.tier]}</Badge>}
                  {r.claim && <Badge variant="outline">Self-reported</Badge>}
                  {r.eq && <Badge variant="secondary">Equivalency accepted</Badge>}
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-4 text-sm">
                {r.eq && <p className="text-muted-foreground">Staff accepted outside evidence on {when(r.eq.createdAt, tz)}. It unlocks projects that need Emerging, but it isn't a platform credential.</p>}
                {r.ev.length > 0 && (
                  <div>
                    <ul className="grid gap-1 text-muted-foreground">
                      {r.ev.map((e) => <li key={e.ev.id} className={e.ev.revokedAt ? "line-through" : undefined}>{e.project} ({e.org}) · scored {e.ev.score}/4 · {when(e.ev.createdAt, tz)}{e.ev.revokedAt && " (revoked)"}</li>)}
                    </ul>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {r.tier === "bronze" ? "Highest tier in the pilot." : r.tier === "emerging" ? "Next: Bronze needs a second project reviewed by a different assessor." : "Next: Emerging needs a score of 3 or more."}
                    </p>
                  </div>
                )}
                <form action={skillAction} id={`skill-${r.id}`} className="grid gap-3 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
                  <input type="hidden" name="skillId" value={r.id} />
                  <SelectField label={r.claim ? "Your level" : "Add your own level"} name="level" defaultValue={r.claim?.level} placeholder="Choose" options={LEVEL_OPTIONS} />
                  <Field label="Where (optional)" name="note" defaultValue={r.claim?.note} placeholder="Course, club, job" />
                  <div className="flex gap-2">
                    <Button name="intent" value="save" size="sm" variant="secondary">{r.claim ? "Update" : "Add"}</Button>
                    {r.claim && (
                      <ConfirmSubmit formId={`skill-${r.id}`} name="intent" value="remove" size="icon-sm" variant="ghost" aria-label={`Remove your self-reported ${r.name}`}
                        ask={{ title: `Remove ${r.name}?`, description: "Only your self-reported level goes. Verified evidence stays.", confirm: "Remove", destructive: true }}>
                        <Trash2 />
                      </ConfirmSubmit>
                    )}
                  </div>
                </form>
              </CardContent>
            </Card>
          ))}
          {unlisted.length > 0 && (
            <Card className="border-dashed">
              <form action={skillAction}>
                <CardHeader><CardTitle className="text-base">Add a skill</CardTitle><CardDescription>Something you've learned in a course, club or job.</CardDescription></CardHeader>
                <CardContent className="grid gap-3 pt-4 sm:grid-cols-3 sm:items-end">
                  <SelectField label="Skill" name="skillId" placeholder="Choose a skill" options={unlisted.map((s) => ({ value: s.id, label: s.name }))} />
                  <SelectField label="Level" name="level" defaultValue="coursework" options={LEVEL_OPTIONS} />
                  <Field label="Where (optional)" name="note" placeholder="Course, club, job" />
                </CardContent>
                <CardFooter className="mt-4"><Button name="intent" value="add">Add skill</Button></CardFooter>
              </form>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="credentials" className="mt-4 grid gap-3">
          <p className="max-w-prose text-sm text-muted-foreground">
            Private until you share. A public link shows the summary, issuer and status, never your files or feedback. Turning it off stops the link at once.
          </p>
          {creds.map((c) => {
            const Icon = KIND[c.kind];
            return (
              <Card key={c.id} className="py-4">
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Icon className="size-5 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{c.title}</p>
                    <p className="text-sm text-muted-foreground">Issued {when(c.issuedAt, tz)} · {c.status}{c.isPublic && " · public"}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button asChild size="sm" variant="ghost"><Link href={`/credentials/${c.id}`}>{c.isPublic ? "Open" : "Preview"}</Link></Button>
                    <form action={shareAction}>
                      <input type="hidden" name="credentialId" value={c.id} />
                      <input type="hidden" name="public" value={c.isPublic ? "0" : "1"} />
                      <Button size="sm" variant="outline">{c.isPublic ? <><EyeOff /> Make private</> : <><Eye /> Share</>}</Button>
                    </form>
                  </div>
                </CardContent>
              </Card>
            );
          })}
          {!creds.length && <p className="text-sm text-muted-foreground">Credentials appear when a mentor accepts your work.</p>}
        </TabsContent>

        <TabsContent value="details" className="mt-4">
          <Card className="max-w-2xl">
            <form action={saveProfileAction}>
              <CardHeader><CardDescription>Companies see these only when you apply to one of their projects.</CardDescription></CardHeader>
              <CardContent className="grid gap-5 pt-4">
                <Field label="Display name" name="name" defaultValue={me.name} required autoComplete="name" />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Pronouns (optional)" name="pronouns" defaultValue={profile.pronouns} placeholder="she/her" />
                  <Field label="Discipline" name="discipline" defaultValue={profile.discipline} placeholder="Mechanical engineering" />
                </div>
                <TextArea label="Short bio" name="bio" defaultValue={profile.bio} rows={3} maxLength={600} />
                <Field label="Interests" name="interests" defaultValue={profile.interests.join(", ")} hint="Comma separated. Used to suggest projects." />
                <TextArea label="What you want to learn next" name="goals" defaultValue={profile.goals} rows={2} />
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Hours per week" name="weeklyHours" type="number" inputMode="numeric" min={0} max={60} defaultValue={profile.weeklyHours} />
                  <SelectField label="Timezone" name="timezone" defaultValue={profile.timezone}
                    options={Intl.supportedValuesOf("timeZone").map((z) => ({ value: z, label: z.replaceAll("_", " ") }))} />
                </div>
              </CardContent>
              <CardFooter className="mt-4"><Button type="submit">Save details</Button></CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </Page>
  );
}
