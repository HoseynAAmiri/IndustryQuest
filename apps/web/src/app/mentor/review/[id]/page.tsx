import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { briefVersions, enrollments, files, skills, submissions, user } from "@iq/db";
import { Alert, Button, Field, Page, SelectField, TextArea, messages, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { ConfirmSubmit } from "@/components/confirm";
import { assessAction } from "../../actions";
import { openCaseAction } from "@/app/support/actions";

const SCALE = [
  { value: "4", label: "4 · Strong evidence" }, { value: "3", label: "3 · Demonstrated" },
  { value: "2", label: "2 · Developing" }, { value: "1", label: "1 · Not yet demonstrated" }, { value: "na", label: "Not applicable" },
];

export default async function Review({ params, searchParams }: PageProps<"/mentor/review/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const { error } = await messages(searchParams);
  const db = getDb();
  const [row] = await db.select({ s: submissions, e: enrollments, v: briefVersions, student: user.name }).from(submissions)
    .innerJoin(enrollments, eq(enrollments.id, submissions.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(eq(submissions.id, id)).catch(() => []);
  if (!row || row.e.mentorId !== me.id) notFound();
  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  const evidence = await db.select().from(files).where(eq(files.enrollmentId, row.e.id));
  const open = row.e.state === "submitted";
  return (
    <Page title={`Review: ${row.student}`} description={`${row.v.title} · version ${row.s.version} · submitted ${when(row.s.createdAt, "UTC", true)}`}
      back={{ href: "/mentor", label: "Review queue" }}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <form action={assessAction} id="assess" className="grid gap-4">
          <input type="hidden" name="submissionId" value={id} />
          {row.v.content.rubric.map((c) => (
            <Card key={c.id}>
              <CardHeader>
                <CardTitle className="flex flex-wrap items-center gap-2 text-base">
                  {c.name}
                  {c.critical ? <Badge>Required · {c.threshold}+</Badge> : <Badge variant="outline">Optional</Badge>}
                  {c.skillId && <Badge variant="secondary">Evidence for {names[c.skillId]}</Badge>}
                </CardTitle>
                <CardDescription>{c.description}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <input type="hidden" name="criterionId" value={c.id} />
                <SelectField label="Score" name={`score.${c.id}`} options={SCALE} placeholder="Choose a score" />
                <Field label="Comment on this criterion" name={`comment.${c.id}`} />
                <div className="sm:col-span-2">
                  <label className="text-sm text-muted-foreground" htmlFor={`na-${c.id}`}>If not applicable, why</label>
                  <Input id={`na-${c.id}`} name={`na.${c.id}`} className="mt-1" />
                </div>
              </CardContent>
            </Card>
          ))}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Decision</CardTitle>
              <CardDescription>
                Accept only if every required criterion meets its threshold. A revision needs specific, doable changes.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <TextArea label="Overall feedback" name="comment" rows={4} hint="The student sees this. Required for a revision or non-completion." />
              <Field label="Days allowed for a revision" name="revisionDays" type="number" min={1} max={30} defaultValue={7} className="max-w-32" />
            </CardContent>
            <CardFooter className="flex-wrap gap-2">
              <Button name="decision" value="accept" disabled={!open}>Accept work</Button>
              <Button name="decision" value="revise" variant="secondary" disabled={!open}>Request revision</Button>
              <ConfirmSubmit formId="assess" name="decision" value="not_complete" variant="ghost" disabled={!open}
                ask={{ title: "Close as not completed?", description: "The project ends without a credential or XP. The student is told why and can appeal. Consider a revision first.", confirm: "Close as not completed", destructive: true }}>
                Not completed
              </ConfirmSubmit>
            </CardFooter>
          </Card>
        </form>
        <aside className="grid h-fit gap-4 lg:sticky lg:top-20">
          <Card>
            <CardHeader><CardTitle className="text-base">What {row.student.split(" ")[0]} submitted</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p className="whitespace-pre-line">{row.s.contributionStatement}</p>
              <ul className="grid gap-1">
                {evidence.filter((f) => row.s.fileIds.includes(f.id)).map((f) => (
                  <li key={f.id}><a className="text-primary underline-offset-4 hover:underline" href={`/api/files/${f.id}`}>{f.name}</a></li>
                ))}
              </ul>
              {row.s.reflection && <p className="rounded-lg bg-muted/50 p-3"><span className="font-medium">Private reflection:</span> {row.s.reflection}</p>}
            </CardContent>
          </Card>
          {!open && <Alert tone="info">This version was already reviewed.</Alert>}
          {open && <Card>
            <form action={openCaseAction}>
              <CardHeader><CardTitle className="text-base">Conflict of interest?</CardTitle><CardDescription>Do not score the work. Tell program staff privately so they can assign another reviewer.</CardDescription></CardHeader>
              <CardContent className="grid gap-3 pt-4">
                <input type="hidden" name="type" value="reviewer_conflict" /><input type="hidden" name="enrollmentId" value={row.e.id} />
                <TextArea label="Describe the conflict" name="summary" rows={3} required minLength={10} />
                <Button size="sm" variant="secondary" className="justify-self-start">Request another reviewer</Button>
              </CardContent>
            </form>
          </Card>}
        </aside>
      </div>
    </Page>
  );
}
