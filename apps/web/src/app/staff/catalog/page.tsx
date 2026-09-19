import { asc, desc } from "drizzle-orm";
import { holidays, rubricTemplates, skills } from "@iq/db";
import { holidayAction, rubricTemplateAction, skillCatalogAction } from "@/app/staff/actions";
import { Alert, Button, CheckField, Field, NONE, Page, SelectField, TextArea, messages } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

export default async function Catalog({ searchParams }: PageProps<"/staff/catalog">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Pilot settings"><Alert>Staff only.</Alert></Page>;
  const { error } = await messages(searchParams);
  const [catalog, templates, days] = await Promise.all([
    db.select().from(skills).orderBy(asc(skills.name)),
    db.select().from(rubricTemplates).orderBy(asc(rubricTemplates.name), desc(rubricTemplates.version)),
    db.select().from(holidays).orderBy(asc(holidays.day)),
  ]);
  return <Page title="Skills and calendar" description="Restricted pilot settings. Every change goes to the audit log.">
    <div className="mb-6"><Alert>{error}</Alert></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Card><CardHeader><CardTitle>Skill catalog</CardTitle><CardDescription>Rename or deactivate a skill without deleting its evidence. Add aliases separated by commas.</CardDescription></CardHeader>
        <CardContent className="grid gap-4">
          {catalog.map((s) => <form action={skillCatalogAction} className="grid gap-3 rounded-lg border p-3" key={s.id}>
            <input type="hidden" name="id" value={s.id} /><div className="grid gap-3 sm:grid-cols-2"><Field label="Name" name="name" defaultValue={s.name} required />
            <Field label="Aliases" name="aliases" defaultValue={s.aliases.join(", ")} /></div><CheckField label="Available for new briefs" name="active" defaultChecked={s.active} />
            <Button size="sm" variant="secondary" className="justify-self-start">Save</Button>
          </form>)}
          <form action={skillCatalogAction} className="grid gap-3 rounded-lg border border-dashed p-3"><p className="font-medium">Add a skill</p>
            <div className="grid gap-3 sm:grid-cols-2"><Field label="ID" name="id" placeholder="data-visualization" required /><Field label="Name" name="name" required /></div>
            <Field label="Aliases" name="aliases" /><CheckField label="Available for new briefs" name="active" defaultChecked />
            <Button size="sm" className="justify-self-start">Add skill</Button>
          </form>
        </CardContent>
      </Card>
      <div className="grid h-fit gap-6">
        <Card><CardHeader><CardTitle>Rubric templates</CardTitle><CardDescription>Saving the same name creates a new version. Old briefs keep their copied rubric.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2 text-sm">{templates.map((t) => <li key={t.id} className="flex items-center gap-2"><span className="flex-1">{t.name}</span><Badge variant="outline">v{t.version}</Badge><span className="text-muted-foreground">{t.criteria[0]?.name}</span></li>)}</ul>
            <form action={rubricTemplateAction} className="grid gap-3 border-t pt-4">
              <Field label="Template name" name="name" required /><Field label="Required criterion" name="criterion" required />
              <TextArea label="What meets the standard" name="description" required rows={2} /><div className="grid gap-3 sm:grid-cols-2">
                <Field label="Threshold (1 to 4)" name="threshold" type="number" min={1} max={4} defaultValue={3} required />
                <SelectField label="Skill evidence (optional)" name="skillId" defaultValue={NONE} options={[{ value: NONE, label: "None" }, ...catalog.filter((s) => s.active).map((s) => ({ value: s.id, label: s.name }))]} />
              </div><Button size="sm" className="justify-self-start">Save new version</Button>
            </form>
          </CardContent>
        </Card>
        <Card><CardHeader><CardTitle>Holiday calendar</CardTitle><CardDescription>Review targets and overdue reminders skip these dates.</CardDescription></CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2">{days.map((d) => <li key={d.day} className="flex items-center gap-3 text-sm"><span className="flex-1">{d.name} · {d.day}</span>
              <form action={holidayAction}><input type="hidden" name="day" value={d.day} /><Button size="sm" variant="ghost" name="intent" value="remove">Remove</Button></form></li>)}</ul>
            <form action={holidayAction} className="grid gap-3 border-t pt-4 sm:grid-cols-2"><Field label="Date" name="day" type="date" required /><Field label="Name" name="name" required />
              <Button size="sm" className="justify-self-start">Add holiday</Button></form>
          </CardContent>
        </Card>
      </div>
    </div>
  </Page>;
}
