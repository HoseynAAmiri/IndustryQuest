import { eq } from "drizzle-orm";
import { studentProfiles } from "@iq/db";
import { Button, Field, Page, TextArea, inputClass } from "@/components/ui";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { saveProfile } from "./actions";

export default async function Onboarding() {
  const user = await requireUser();
  const [p] = await getDb().select().from(studentProfiles).where(eq(studentProfiles.userId, user.id));
  return (
    <Page title="Tell us what you're looking for">
      <p className="mb-6 max-w-prose text-slate-700">
        We use this to suggest projects that fit. Everything here is optional and private, and you can change it later.
      </p>
      <form action={saveProfile} className="max-w-md space-y-4">
        <Field label="Interests" name="interests" defaultValue={p?.interests.join(", ")}
          hint="Comma separated, for example: vibration analysis, Python, data cleaning" />
        <TextArea label="What do you want to learn next?" name="goals" defaultValue={p?.goals} rows={3} />
        <Field label="Hours per week you can give a project" name="weeklyHours" type="number" min={0} max={60} defaultValue={p?.weeklyHours ?? 5} />
        <label className="block">
          <span className="font-medium">Your timezone</span>
          <span className="block text-sm text-slate-600">Deadlines show in this timezone.</span>
          <select name="timezone" className={inputClass} defaultValue={p?.timezone ?? "UTC"}>
            {Intl.supportedValuesOf("timeZone").map((tz) => <option key={tz}>{tz}</option>)}
          </select>
        </label>
        <div className="flex gap-3">
          <Button type="submit">Save and browse projects</Button>
          <button name="skip" value="1" className="rounded px-4 py-2 text-blue-700 underline">Skip for now</button>
        </div>
      </form>
    </Page>
  );
}
