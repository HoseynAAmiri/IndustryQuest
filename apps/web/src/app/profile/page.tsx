import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { desc, eq } from "drizzle-orm";
import { Award, BadgeCheck, Copy, Eye, EyeOff, Medal, Pencil, Sparkles, Star, Trophy } from "lucide-react";
import { progress, tierFor } from "@iq/core";
import { briefVersions, credentials, enrollments, organizations, projects, skillClaims, skillEvidence, skills, studentProfiles, xpTransactions } from "@iq/db";
import { CLAIM_LEVELS } from "@/server/profile";
import { Stat } from "@/app/dashboard";
import { Alert, Button, Page, messages, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { issuePendingFor } from "@/server/rewards";
import { shareAction } from "./actions";

export const metadata: Metadata = { title: "Profile" };

const KIND = { completion: Trophy, achievement: Medal, skill_tier: Award } as const;

export default async function Profile({ searchParams }: PageProps<"/profile">) {
  const me = await requireUser();
  const db = getDb();
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!profile) redirect("/onboarding");
  const { error, info } = await messages(searchParams);
  await issuePendingFor(db, me.id);
  const tz = profile.timezone;

  const ledger = await db.select().from(xpTransactions).where(eq(xpTransactions.userId, me.id)).orderBy(desc(xpTransactions.createdAt));
  const xp = ledger.reduce((n, t) => n + t.amount, 0);
  const p = progress(xp);
  const creds = await db.select().from(credentials).where(eq(credentials.userId, me.id)).orderBy(desc(credentials.issuedAt));
  const evidence = await db.select({ ev: skillEvidence, skill: skills.name, project: briefVersions.title, org: organizations.name })
    .from(skillEvidence).innerJoin(skills, eq(skills.id, skillEvidence.skillId))
    .innerJoin(enrollments, eq(enrollments.id, skillEvidence.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(skillEvidence.userId, me.id)).orderBy(desc(skillEvidence.createdAt));
  const bySkill = Object.entries(Object.groupBy(evidence, (e) => e.ev.skillId)).map(([id, rows]) => ({
    id, name: rows![0].skill, rows: rows!, tier: tierFor(rows!.map((r) => r.ev)),
  }));
  const claims = await db.select({ c: skillClaims, name: skills.name }).from(skillClaims)
    .innerJoin(skills, eq(skills.id, skillClaims.skillId)).where(eq(skillClaims.userId, me.id));
  const completed = creds.filter((c) => c.kind === "completion").length;

  return (
    <Page title={me.name}
      description={[profile.pronouns, profile.discipline].filter(Boolean).join(" · ") || "Your XP, verified skills and shareable records."}
      actions={<Button asChild variant="outline"><Link href="/profile/edit"><Pencil /> Edit profile</Link></Button>}>
      {profile.bio && <p className="-mt-3 mb-6 max-w-prose text-muted-foreground">{profile.bio}</p>}
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>

      <Card className="mb-6">
        <CardHeader>
          <CardDescription>Account level (from XP)</CardDescription>
          <CardTitle className="text-3xl">Level {p.level}</CardTitle>
          <CardAction className="text-right"><span className="text-2xl font-semibold tabular-nums">{xp}</span> <span className="text-muted-foreground">XP</span></CardAction>
        </CardHeader>
        <CardContent className="grid gap-2">
          <Progress value={((xp - p.levelStart) / (p.nextLevelAt - p.levelStart)) * 100} aria-label="Progress to next level" />
          <p className="text-sm text-muted-foreground">
            {p.nextLevelAt - xp} XP to level {p.level + 1}. XP counts accepted project work only. It shows how much you've done,
            not how good you are at any one skill, and it never unlocks a project by itself.
          </p>
        </CardContent>
      </Card>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Stat label="Verified projects" value={completed} icon={Trophy} />
        <Stat label="Skills with evidence" value={bySkill.filter((s) => s.tier !== "none").length} icon={Sparkles} />
        <Stat label="Achievements" value={creds.filter((c) => c.kind === "achievement").length} icon={Star} />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Skills</CardTitle>
            <CardDescription>Platform-verified tiers come from rubric scores of 3 or 4. Emerging: one project. Bronze: two projects, two reviewers.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            {bySkill.map((s) => (
              <div key={s.id} className="grid gap-2 rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{s.name}</span>
                  {s.tier === "none" ? <Badge variant="outline">Not yet verified</Badge> : <Badge className="gap-1"><BadgeCheck className="size-3" />{s.tier === "bronze" ? "Bronze" : "Emerging"}</Badge>}
                </div>
                <ul className="grid gap-1 text-sm text-muted-foreground">
                  {s.rows.map((r) => <li key={r.ev.id}>{r.project} ({r.org}) · scored {r.ev.score}/4 · {when(r.ev.createdAt, tz)}</li>)}
                </ul>
                <p className="text-xs text-muted-foreground">
                  {s.tier === "bronze" ? "Highest tier in the pilot." : s.tier === "emerging" ? "Next: Bronze needs a second project reviewed by a different assessor." : "Next: Emerging needs one criterion scored 3 or more."}
                </p>
              </div>
            ))}
            {!bySkill.length && <p className="text-sm text-muted-foreground">No verified skills yet. Complete a project to earn your first evidence.</p>}
            <div className="grid gap-2 border-t pt-4">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium">Self-reported</span>
                <Button asChild variant="ghost" size="sm"><Link href="/profile/skills">Manage</Link></Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {claims.map(({ c, name }) => <Badge key={c.skillId} variant="outline">{name} · {CLAIM_LEVELS[c.level].toLowerCase()}</Badge>)}
                {!claims.length && <span className="text-sm text-muted-foreground">Add skills you've learned in courses or jobs.</span>}
              </div>
              {profile.interests.length > 0 && <p className="text-sm text-muted-foreground">Interests: {profile.interests.join(", ")}</p>}
            </div>
          </CardContent>
        </Card>

        <Card id="credentials">
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>Private until you share. A public link shows the summary, issuer and status, never your files or feedback.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-3">
              {creds.map((c) => {
                const Icon = KIND[c.kind];
                return (
                  <li key={c.id} className="grid gap-2 rounded-lg border p-3">
                    <div className="flex items-start gap-3">
                      <Icon className="mt-0.5 size-5 text-primary" aria-hidden />
                      <div className="flex-1">
                        <p className="font-medium">{c.title}</p>
                        <p className="text-sm text-muted-foreground">Issued {when(c.issuedAt, tz)} · {c.status}</p>
                      </div>
                      {c.isPublic && <Badge variant="secondary">Public</Badge>}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <form action={shareAction}>
                        <input type="hidden" name="credentialId" value={c.id} />
                        <input type="hidden" name="public" value={c.isPublic ? "0" : "1"} />
                        <Button size="sm" variant="outline">{c.isPublic ? <><EyeOff /> Make private</> : <><Eye /> Share publicly</>}</Button>
                      </form>
                      <Button asChild size="sm" variant="ghost"><Link href={`/credentials/${c.id}`}><Copy /> {c.isPublic ? "Open public page" : "Preview"}</Link></Button>
                    </div>
                  </li>
                );
              })}
              {!creds.length && <li className="text-sm text-muted-foreground">Credentials appear when a mentor accepts your work.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>XP history</CardTitle><CardDescription>Every award and correction, with its reason. Nothing is edited silently.</CardDescription></CardHeader>
          <CardContent>
            <Table>
              <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reason</TableHead><TableHead>Type</TableHead><TableHead className="text-right">XP</TableHead></TableRow></TableHeader>
              <TableBody>
                {ledger.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell>{when(t.createdAt, tz)}</TableCell>
                    <TableCell className="whitespace-normal">{t.reason}</TableCell>
                    <TableCell>{t.kind === "issue" ? "Award" : "Correction"}</TableCell>
                    <TableCell className="text-right tabular-nums">{t.amount > 0 ? `+${t.amount}` : t.amount}</TableCell>
                  </TableRow>
                ))}
                {!ledger.length && <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">No XP yet.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
