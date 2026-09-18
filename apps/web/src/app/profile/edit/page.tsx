import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { studentProfiles } from "@iq/db";
import { Alert, Button, Field, Page, SelectField, TextArea, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { saveProfileAction } from "../actions";

export const metadata: Metadata = { title: "Edit profile" };

export default async function EditProfile({ searchParams }: PageProps<"/profile/edit">) {
  const me = await requireUser();
  const db = getDb();
  const [p] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!p) redirect("/onboarding");
  const { error, info } = await messages(searchParams);
  return (
    <Page title="Edit profile" back={{ href: "/profile", label: "Profile" }}
      description="Your profile is private. Companies see it only when you apply to one of their projects.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
      <div className="mx-auto grid max-w-2xl gap-6">
        <Card>
          <form action={saveProfileAction}>
            <CardHeader><CardTitle>About you</CardTitle></CardHeader>
            <CardContent className="grid gap-5 pt-4">
              <Field label="Display name" name="name" defaultValue={me.name} required autoComplete="name" />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Pronouns (optional)" name="pronouns" defaultValue={p.pronouns} placeholder="she/her" />
                <Field label="Discipline" name="discipline" defaultValue={p.discipline} placeholder="Mechanical engineering" />
              </div>
              <TextArea label="Short bio" name="bio" defaultValue={p.bio} rows={3} maxLength={600} />
              <Field label="Interests" name="interests" defaultValue={p.interests.join(", ")} hint="Comma separated. Used to suggest projects." />
              <TextArea label="What you want to learn next" name="goals" defaultValue={p.goals} rows={2} />
              <div className="grid gap-5 sm:grid-cols-2">
                <Field label="Hours per week" name="weeklyHours" type="number" inputMode="numeric" min={0} max={60} defaultValue={p.weeklyHours} />
                <SelectField label="Timezone" name="timezone" defaultValue={p.timezone}
                  options={Intl.supportedValuesOf("timeZone").map((tz) => ({ value: tz, label: tz.replaceAll("_", " ") }))} />
              </div>
            </CardContent>
            <CardFooter className="mt-4"><Button type="submit">Save profile</Button></CardFooter>
          </form>
        </Card>

      </div>
    </Page>
  );
}
