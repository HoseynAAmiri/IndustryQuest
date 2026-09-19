import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { Building2, GraduationCap, Users } from "lucide-react";
import { skills, studentProfiles } from "@iq/db";
import { Alert, Button, CheckField, Field, Page, SelectField, TextArea, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { PARTICIPATION } from "@/server/profile";
import { companyAction, saveProfile } from "./actions";

const ROLES = [
  { id: "student", icon: GraduationCap, title: "I'm a student", text: "Find projects, work with a mentor, earn verified evidence." },
  { id: "company", icon: Building2, title: "My company offers projects", text: "Register your organization and draft briefs." },
  { id: "mentor", icon: Users, title: "I'm a mentor", text: "Support students on your company's projects." },
] as const;

// ACC-02: one account can hold several roles; pick where to start. ACC-09: everything optional can be skipped.
export default async function Onboarding({ searchParams }: PageProps<"/onboarding">) {
  const user = await requireUser();
  const { error } = await messages(searchParams);
  const role = String((await searchParams).role ?? "");
  const db = getDb();
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));

  if (!ROLES.some((r) => r.id === role))
    return (
      <Page title={`Welcome, ${user.name.split(" ")[0]}`} description="How will you use IndustryQuest? You can add other roles later.">
        <div className="grid gap-4 md:grid-cols-3">
          {ROLES.map((r) => (
            <Link key={r.id} href={`/onboarding?role=${r.id}`} className="rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
              <Card className="lift h-full">
                <CardHeader>
                  <r.icon className="mb-2 size-6 text-primary" aria-hidden />
                  <CardTitle>{r.title}</CardTitle>
                  <CardDescription>{r.text}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </Page>
    );

  if (role === "mentor")
    return (
      <Page narrow title="Mentoring" back={{ href: "/onboarding", label: "Back" }}>
        <Card>
          <CardContent className="grid gap-3 text-sm">
            <p>Mentors support students on their own company's projects. Ask an owner at your company to add you from <strong>Company → Team</strong> using <strong>{user.email}</strong>.</p>
            <p className="text-muted-foreground">Once added, you'll see your review queue and can fill in your mentor profile. Program staff verify mentors before they're shown as verified.</p>
            <Button asChild variant="outline" className="justify-self-start"><Link href="/onboarding?role=student">I'm also a student</Link></Button>
          </CardContent>
        </Card>
      </Page>
    );

  if (role === "company")
    return (
      <Page narrow title="Register your organization" back={{ href: "/onboarding", label: "Back" }}
        description="Staff verify every organization before its briefs can go live.">
        <Card>
          <CardContent>
            <form action={companyAction} className="grid gap-5">
              <Alert>{error}</Alert>
              <Field label="Organization name" name="name" required />
              <TextArea label="What your organization does" name="description" rows={2} />
              <TextArea label="A challenge you'd like help with (optional)" name="challenge" rows={4}
                hint="Describe a real problem in plain words. Program staff will help you turn it into a small, well-scoped learning project." />
              <Button type="submit" className="justify-self-start">Create organization</Button>
            </form>
          </CardContent>
        </Card>
      </Page>
    );

  const allSkills = await db.select().from(skills).orderBy(asc(skills.name));
  return (
    <Page narrow title="What are you looking for?" back={{ href: "/onboarding", label: "Back" }}
      description="We use this to suggest projects that fit. It's all optional and private, and you can change it later.">
      <Card>
        <CardContent>
          <form action={saveProfile} className="grid gap-5">
            <Field label="Interests" name="interests" defaultValue={p?.interests.join(", ")}
              hint="Comma separated, for example: vibration analysis, Python, data cleaning" />
            <TextArea label="What do you want to learn next?" name="goals" defaultValue={p?.goals} rows={3} />
            <fieldset>
              <legend className="mb-2 text-sm font-medium">Skills you've used in courses (optional)</legend>
              <div className="grid grid-cols-2 gap-2">
                {allSkills.map((s) => <CheckField key={s.id} name="skills" value={s.id} label={s.name} />)}
              </div>
              <p className="mt-2 text-xs text-muted-foreground">These show as self-reported. Verified skills come from reviewed project work.</p>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Hours per week" name="weeklyHours" type="number" min={0} max={60} defaultValue={p?.weeklyHours ?? 5} />
              <SelectField label="How you'd like to work" name="participation" defaultValue={p?.participation ?? "remote"}
                options={Object.entries(PARTICIPATION).map(([value, label]) => ({ value, label }))} />
            </div>
            <SelectField label="Your timezone" name="timezone" hint="Deadlines show in this timezone." defaultValue={p?.timezone ?? "UTC"}
              options={Intl.supportedValuesOf("timeZone").map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }))} />
            <div className="flex flex-wrap gap-2">
              <Button type="submit">Save and browse projects</Button>
              <Button type="submit" name="skip" value="1" variant="ghost">Skip for now</Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </Page>
  );
}
