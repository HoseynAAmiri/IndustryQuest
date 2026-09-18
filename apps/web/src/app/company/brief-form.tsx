import type { Brief } from "@iq/core";
import { Button, Field, TextArea, inputClass } from "@/components/ui";
import { saveBrief } from "./actions";

type Opt = { id: string; name: string };
const ROWS = [0, 1, 2, 3, 4];

export function BriefForm({ orgId, projectId, b, mentors, skills }: {
  orgId: string; projectId?: string; b?: Brief; mentors: Opt[]; skills: Opt[];
}) {
  const skillSelect = (name: string, value?: string, label = "Skill") => (
    <label className="block text-sm">{label}
      <select name={name} defaultValue={value ?? ""} className={inputClass}>
        <option value="">None</option>
        {skills.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
      </select>
    </label>
  );
  return (
    <form action={saveBrief} className="space-y-8">
      <input type="hidden" name="orgId" value={orgId} />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Public listing</legend>
        <Field label="Title" name="title" defaultValue={b?.title} required maxLength={120} />
        <TextArea label="Summary" name="summary" defaultValue={b?.summary} rows={3} hint="Shown on project cards. At least 20 characters." />
        <TextArea label="The real problem" name="problem" defaultValue={b?.problem} hint="What the company needs and who benefits." />
        <div className="grid gap-4 sm:grid-cols-3">
          <label className="block"><span className="font-medium">Tier</span>
            <select name="tier" defaultValue={b?.tier ?? "Q1"} className={inputClass}>
              <option value="Q1">Q1 Starter (2–6 h, 120 XP)</option><option value="Q2">Q2 Foundation (6–15 h, 250 XP)</option>
            </select>
          </label>
          <Field label="Effort (hours)" name="effortHours" type="number" min={1} max={200} defaultValue={b?.effortHours ?? 4} />
          <Field label="Places" name="capacity" type="number" min={1} max={50} defaultValue={b?.capacity ?? 1} />
        </div>
        <label className="flex items-center gap-2">
          <input type="checkbox" name="beginner" defaultChecked={b?.beginner ?? true} /> Open to students with no verified work yet
        </label>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Mentoring and schedule</legend>
        <label className="block"><span className="font-medium">Mentor</span>
          <span className="block text-sm text-slate-600">Only people who agreed to support this project.</span>
          <select name="mentorId" defaultValue={b?.mentorId ?? ""} className={inputClass}>
            <option value="">Choose a mentor</option>
            {mentors.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </label>
        <Field label="Backup escalation contact" name="backupContact" defaultValue={b?.backupContact} hint="Name and email of someone who can step in." />
        <Field label="Application deadline (UTC)" name="applyDeadline" type="date" defaultValue={b?.applyDeadline} />
        <div>
          <span className="font-medium">Milestones</span>
          {ROWS.map((i) => (
            <div key={i} className="mt-2 grid grid-cols-[1fr_8rem] gap-2">
              <input aria-label={`Milestone ${i + 1} title`} name={`m${i}.title`} defaultValue={b?.milestones[i]?.title} className={inputClass} />
              <input aria-label={`Milestone ${i + 1} due, days after start`} name={`m${i}.days`} type="number" min={1} placeholder="days"
                defaultValue={b?.milestones[i]?.dueInDays} className={inputClass} />
            </div>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Work and terms</legend>
        <TextArea label="Deliverables" name="deliverables" defaultValue={b?.deliverables.join("\n")} hint="One per line." />
        <TextArea label="Resources" name="resources" defaultValue={b?.resources} hint="Data, software, starter material, access instructions." />
        <label className="block"><span className="font-medium">Compensation</span>
          <select name="compensation" defaultValue={b?.compensation ?? ""} className={inputClass}>
            <option value="">Choose</option><option value="paid">Paid</option><option value="stipend">Stipend</option>
            <option value="unpaid">Unpaid</option><option value="course">Course-associated</option>
          </select>
        </label>
        <Field label="Compensation amount and conditions" name="compensationDetails" defaultValue={b?.compensationDetails} />
        <TextArea label="Terms" name="terms" defaultValue={b?.terms} hint="Participation, confidentiality, who owns the work, what may go in a portfolio." />
      </fieldset>

      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold">Skills and assessment</legend>
        <div>
          <span className="font-medium">Skills this project builds</span>
          <div className="mt-1 flex flex-wrap gap-4">
            {skills.map((s) => (
              <label key={s.id} className="flex items-center gap-1">
                <input type="checkbox" name="skillIds" value={s.id} defaultChecked={b?.skillIds.includes(s.id)} /> {s.name}
              </label>
            ))}
          </div>
        </div>
        <div>
          <span className="font-medium">Required skill evidence</span>
          <span className="block text-sm text-slate-600">Leave empty for beginner projects. XP never counts as a prerequisite.</span>
          {[0, 1, 2].map((i) => (
            <div key={i} className="mt-2 grid grid-cols-2 gap-2">
              {skillSelect(`p${i}.skill`, b?.prerequisites[i]?.skillId, `Prerequisite ${i + 1}`)}
              <label className="block text-sm">Minimum tier
                <select name={`p${i}.tier`} defaultValue={b?.prerequisites[i]?.minTier ?? "emerging"} className={inputClass}>
                  <option value="emerging">Emerging</option><option value="bronze">Bronze</option>
                </select>
              </label>
            </div>
          ))}
        </div>
        <div>
          <span className="font-medium">Rubric</span>
          <span className="block text-sm text-slate-600">Scores run 1 to 4. Required criteria must reach their threshold to pass.</span>
          {ROWS.map((i) => {
            const c = b?.rubric[i];
            return (
              <div key={i} className="mt-3 grid gap-2 rounded border border-slate-200 p-3 sm:grid-cols-2">
                <label className="block text-sm">Criterion {i + 1}<input name={`r${i}.name`} defaultValue={c?.name} className={inputClass} /></label>
                {skillSelect(`r${i}.skill`, c?.skillId, "Gives evidence for skill")}
                <label className="block text-sm sm:col-span-2">What meets the standard
                  <input name={`r${i}.description`} defaultValue={c?.description} className={inputClass} />
                </label>
                <label className="flex items-center gap-2 text-sm"><input type="checkbox" name={`r${i}.critical`} defaultChecked={c?.critical ?? true} /> Required to pass</label>
                <label className="block text-sm">Threshold
                  <select name={`r${i}.threshold`} defaultValue={c?.threshold ?? 3} className={inputClass}>
                    {[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n} of 4</option>)}
                  </select>
                </label>
              </div>
            );
          })}
        </div>
      </fieldset>

      <div className="flex gap-3">
        <Button type="submit" name="intent" value="save">Save draft</Button>
        <Button type="submit" name="intent" value="submit" className="bg-green-800 hover:bg-green-900">Save and submit for review</Button>
      </div>
    </form>
  );
}
