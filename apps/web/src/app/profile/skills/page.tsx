import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { BadgeCheck, Trash2 } from "lucide-react";
import { skillClaims, skills, studentProfiles } from "@iq/db";
import { Alert, Button, Field, Page, SelectField, messages } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { studentTiers } from "@/server/discovery";
import { CLAIM_LEVELS } from "@/server/profile";
import { skillAction } from "../actions";

export const metadata: Metadata = { title: "My skills" };

const LEVEL_OPTIONS = Object.entries(CLAIM_LEVELS).map(([value, label]) => ({ value, label }));
const TIER = { emerging: "Emerging", bronze: "Bronze" } as const;

export default async function Skills({ searchParams }: PageProps<"/profile/skills">) {
  const me = await requireUser();
  const db = getDb();
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!p) redirect("/onboarding");
  const { error, info } = await messages(searchParams);
  const all = await db.select().from(skills).orderBy(asc(skills.name));
  const claims = await db.select({ c: skillClaims, name: skills.name }).from(skillClaims)
    .innerJoin(skills, eq(skills.id, skillClaims.skillId)).where(eq(skillClaims.userId, me.id)).orderBy(asc(skills.name));
  const tiers = Object.entries(await studentTiers(db, me.id)).filter(([, t]) => t !== "none") as [string, "emerging" | "bronze"][];
  const name = Object.fromEntries(all.map((s) => [s.id, s.name]));
  const unclaimed = all.filter((s) => !claims.some((c) => c.c.skillId === s.id));

  return (
    <Page title="My skills" back={{ href: "/profile", label: "Profile" }}
      description="Verified skills come from reviewed work. Self-reported ones tell companies what you've learned elsewhere.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
      <div className="mx-auto max-w-3xl">
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Verified skills</CardTitle>
              <CardDescription>Earned from mentor-reviewed project work. You can't edit these; they update as reviews come in.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              {tiers.map(([id, t]) => <Badge key={id} className="gap-1"><BadgeCheck className="size-3" />{name[id]}: {TIER[t]}</Badge>)}
              {!tiers.length && <p className="text-sm text-muted-foreground">None yet. Your first accepted project adds some.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Self-reported skills</CardTitle>
              <CardDescription>
                What you've learned elsewhere. It helps companies read your application, but it's labelled as self-reported
                and doesn't unlock projects. For that, ask staff about an equivalency review.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {claims.map(({ c, name: skill }) => (
                <form key={c.skillId} action={skillAction} className="grid gap-3 rounded-lg border p-3 sm:grid-cols-[1fr_auto]">
                  <input type="hidden" name="skillId" value={c.skillId} />
                  <div className="grid gap-3">
                    <p className="font-medium">{skill}</p>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <SelectField label="Level" name="level" defaultValue={c.level} options={LEVEL_OPTIONS} />
                      <Field label="Where (optional)" name="note" defaultValue={c.note} placeholder="Signals and Systems, year 2" />
                    </div>
                  </div>
                  <div className="flex gap-2 self-end">
                    <Button name="intent" value="save" size="sm" variant="secondary">Update</Button>
                    <Button name="intent" value="remove" size="icon-sm" variant="ghost" aria-label={`Remove ${skill}`}><Trash2 /></Button>
                  </div>
                </form>
              ))}
              {!claims.length && <p className="text-sm text-muted-foreground">No self-reported skills yet.</p>}
            </CardContent>
            {unclaimed.length > 0 && (
              <CardFooter className="block border-t">
                <form action={skillAction} className="grid gap-3 pt-2">
                  <p className="text-sm font-medium">Add a skill</p>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <SelectField label="Skill" name="skillId" placeholder="Choose a skill"
                      options={unclaimed.map((s) => ({ value: s.id, label: s.name }))} />
                    <SelectField label="Level" name="level" defaultValue="coursework" options={LEVEL_OPTIONS} />
                  </div>
                  <Field label="Where you used it (optional)" name="note" placeholder="Course, club, job" />
                  <Button name="intent" value="add" className="justify-self-start">Add skill</Button>
                </form>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </Page>
  );
}
