import type { ReactNode } from "react";
import type { Brief } from "@iq/core";
import { Button, CheckField, Field, NONE, SelectField, TextArea } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { saveBrief } from "./actions";

type Opt = { id: string; name: string };
const ROWS = [0, 1, 2, 3, 4];
const THRESHOLDS = [1, 2, 3, 4].map((n) => ({ value: String(n), label: `${n} of 4` }));
const TIERS = [{ value: "emerging", label: "Emerging" }, { value: "bronze", label: "Bronze" }];

function Section({ title, description, children }: { title: string; description?: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-5">{children}</CardContent>
    </Card>
  );
}

export function BriefForm({ orgId, projectId, b, mentors, skills }: {
  orgId: string; projectId?: string; b?: Brief; mentors: Opt[]; skills: Opt[];
}) {
  const skillOpts = [{ value: NONE, label: "None" }, ...skills.map((s) => ({ value: s.id, label: s.name }))];
  return (
    <form action={saveBrief} className="grid gap-6">
      <input type="hidden" name="orgId" value={orgId} />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <Section title="Public listing" description="What students see when they browse.">
        <Field label="Title" name="title" defaultValue={b?.title} required maxLength={120} />
        <TextArea label="Summary" name="summary" defaultValue={b?.summary} rows={3} hint="Shown on project cards. At least 20 characters." />
        <TextArea label="The real problem" name="problem" defaultValue={b?.problem} hint="What the company needs and who benefits." />
        <div className="grid gap-5 sm:grid-cols-3">
          <SelectField label="Tier" name="tier" defaultValue={b?.tier ?? "Q1"} options={[
            { value: "Q1", label: "Q1 Starter · 2–6 h · 120 XP" }, { value: "Q2", label: "Q2 Foundation · 6–15 h · 250 XP" },
          ]} />
          <Field label="Effort (hours)" name="effortHours" type="number" min={1} max={200} defaultValue={b?.effortHours ?? 4} />
          <Field label="Places" name="capacity" type="number" min={1} max={50} defaultValue={b?.capacity ?? 1} />
        </div>
        <CheckField label="Open to students with no verified work yet" name="beginner" defaultChecked={b?.beginner ?? true} />
      </Section>

      <Section title="Mentoring and schedule">
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Mentor" name="mentorId" defaultValue={b?.mentorId || NONE} hint="Only someone who agreed to support this project."
            options={[{ value: NONE, label: "No mentor yet" }, ...mentors.map((m) => ({ value: m.id, label: m.name }))]} />
          <Field label="Backup escalation contact" name="backupContact" defaultValue={b?.backupContact} hint="Name and email of someone who can step in." />
        </div>
        <Field label="Application deadline (UTC)" name="applyDeadline" type="date" defaultValue={b?.applyDeadline} className="sm:max-w-56" />
        <fieldset className="grid gap-2">
          <legend className="mb-1 text-sm font-medium">Milestones</legend>
          {ROWS.map((i) => (
            <div key={i} className="grid grid-cols-[1fr_7rem] gap-2">
              <Input aria-label={`Milestone ${i + 1} title`} name={`m${i}.title`} placeholder={`Milestone ${i + 1}`} defaultValue={b?.milestones[i]?.title} />
              <Input aria-label={`Milestone ${i + 1}, days after start`} name={`m${i}.days`} type="number" min={1} placeholder="Day"
                defaultValue={b?.milestones[i]?.dueInDays} />
            </div>
          ))}
          <p className="text-sm text-muted-foreground">Due dates count days from the student's start date.</p>
        </fieldset>
      </Section>

      <Section title="Work and terms">
        <TextArea label="Deliverables" name="deliverables" defaultValue={b?.deliverables.join("\n")} hint="One per line." />
        <TextArea label="Resources" name="resources" defaultValue={b?.resources} hint="Data, software, starter material, access instructions." />
        <div className="grid gap-5 sm:grid-cols-2">
          <SelectField label="Compensation" name="compensation" defaultValue={b?.compensation || NONE} options={[
            { value: NONE, label: "Not decided" }, { value: "paid", label: "Paid" }, { value: "stipend", label: "Stipend" },
            { value: "unpaid", label: "Unpaid" }, { value: "course", label: "Course-associated" },
          ]} />
          <Field label="Amount and conditions" name="compensationDetails" defaultValue={b?.compensationDetails} />
        </div>
        <TextArea label="Terms" name="terms" defaultValue={b?.terms} hint="Participation, confidentiality, who owns the work, what may go in a portfolio." />
      </Section>

      <Section title="Skills and assessment" description="Scores run 1 to 4. Required criteria must reach their threshold to pass.">
        <fieldset>
          <legend className="mb-2 text-sm font-medium">Skills this project builds</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {skills.map((s) => <CheckField key={s.id} label={s.name} name="skillIds" value={s.id} defaultChecked={b?.skillIds.includes(s.id)} />)}
          </div>
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Required skill evidence</legend>
          <p className="-mt-2 text-sm text-muted-foreground">Leave empty for beginner projects. XP never counts as a prerequisite.</p>
          {[0, 1, 2].map((i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <SelectField label={`Prerequisite ${i + 1}`} name={`p${i}.skill`} defaultValue={b?.prerequisites[i]?.skillId ?? NONE} options={skillOpts} />
              <SelectField label="Minimum tier" name={`p${i}.tier`} defaultValue={b?.prerequisites[i]?.minTier ?? "emerging"} options={TIERS} />
            </div>
          ))}
        </fieldset>
        <fieldset className="grid gap-3">
          <legend className="text-sm font-medium">Rubric</legend>
          {ROWS.map((i) => {
            const c = b?.rubric[i];
            return (
              <div key={i} className="grid gap-4 rounded-lg border bg-muted/30 p-4 sm:grid-cols-2">
                <Field label={`Criterion ${i + 1}`} name={`r${i}.name`} defaultValue={c?.name} />
                <SelectField label="Gives evidence for skill" name={`r${i}.skill`} defaultValue={c?.skillId ?? NONE} options={skillOpts} />
                <div className="sm:col-span-2"><Field label="What meets the standard" name={`r${i}.description`} defaultValue={c?.description} /></div>
                <SelectField label="Threshold" name={`r${i}.threshold`} defaultValue={c?.threshold ?? 3} options={THRESHOLDS} />
                <div className="self-end pb-2"><CheckField label="Required to pass" name={`r${i}.critical`} defaultChecked={c?.critical ?? true} /></div>
              </div>
            );
          })}
        </fieldset>
      </Section>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap gap-2 border-t bg-background/95 px-4 py-3 backdrop-blur">
        <Button type="submit" name="intent" value="save" variant="outline">Save draft</Button>
        <Button type="submit" name="intent" value="submit">Save and submit for review</Button>
      </div>
    </form>
  );
}
