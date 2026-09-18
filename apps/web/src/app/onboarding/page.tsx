import { eq } from "drizzle-orm";
import { studentProfiles } from "@iq/db";
import { Button, Field, Page, SelectField, TextArea } from "@/components/ui";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { saveProfile } from "./actions";

export default async function Onboarding() {
  const user = await requireUser();
  const [p] = await getDb().select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
  return (
    <Page narrow title="What are you looking for?"
      description="We use this to suggest projects that fit. It's all optional and private, and you can change it later.">
      <Card>
        <CardContent>
          <form action={saveProfile} className="grid gap-5">
            <Field label="Interests" name="interests" defaultValue={p?.interests.join(", ")}
              hint="Comma separated, for example: vibration analysis, Python, data cleaning" />
            <TextArea label="What do you want to learn next?" name="goals" defaultValue={p?.goals} rows={3} />
            <Field label="Hours per week you can give a project" name="weeklyHours" type="number" min={0} max={60} defaultValue={p?.weeklyHours ?? 5} />
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
