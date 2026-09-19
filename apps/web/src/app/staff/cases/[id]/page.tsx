import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { briefVersions, caseUpdates, cases, enrollments, memberships, projects, user } from "@iq/db";
import { caseUpdateAction, resolveCaseAction, takeCaseAction } from "@/app/support/actions";
import { CaseStatus, Thread } from "@/components/case-list";
import { Alert, Button, EnrollmentBadge, Field, Page, SelectField, TextArea, messages, when } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { CASE_TYPES } from "@/server/cases";
import { getDb } from "@/server/db";

export default async function CasePage({ params, searchParams }: PageProps<"/staff/cases/[id]">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) notFound();
  const { error } = await messages(searchParams);
  const [row] = await db.select({ c: cases, reporter: user }).from(cases).innerJoin(user, eq(user.id, cases.reporterId))
    .where(eq(cases.id, (await params).id)).catch(() => []);
  if (!row) notFound();
  const { c } = row;
  const [e] = c.enrollmentId ? await db.select({ e: enrollments, title: briefVersions.title, orgId: projects.orgId }).from(enrollments)
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .where(eq(enrollments.id, c.enrollmentId)) : [];
  const mentors = e ? await db.select({ id: user.id, name: user.name }).from(memberships).innerJoin(user, eq(user.id, memberships.userId))
    .where(and(eq(memberships.orgId, e.orgId), eq(memberships.role, "mentor"))) : [];
  const updates = await db.select({ u: caseUpdates, author: user.name }).from(caseUpdates).innerJoin(user, eq(user.id, caseUpdates.authorId))
    .where(eq(caseUpdates.caseId, c.id)).orderBy(asc(caseUpdates.createdAt));
  const actions = [
    { value: "none", label: "No change to the project" },
    ...(e && ["active", "revision_requested"].includes(e.e.state) ? [
      { value: "extend", label: "Extend open deadlines" },
      { value: "pause", label: "Approve a pause and move deadlines" },
      { value: "replace_mentor", label: "Replace the mentor" },
      { value: "close", label: "Close participation (work is kept)" },
    ] : []),
    ...(e?.e.state === "closed_incomplete" ? [{ value: "reopen", label: "Reopen for revision (appeal upheld)" }] : []),
    ...(c.type === "equivalency" ? [{ value: "grant_equivalency", label: "Accept the evidence (unlocks projects, no credential)" }] : []),
    ...(c.type === "deletion" ? [{ value: "delete_account", label: "Anonymize account and revoke login (records stay)" }] : []),
  ];

  return (
    <Page title={`#${c.number} · ${CASE_TYPES[c.type]}`} description={`From ${row.reporter.name} · opened ${when(c.createdAt, "UTC", true)}`}
      back={{ href: "/staff/cases", label: "Cases" }} actions={<CaseStatus s={c.status} />}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid h-fit gap-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">What they said</CardTitle>
              {c.requestedDays && <CardDescription>Asked for {c.requestedDays} more days.</CardDescription>}
            </CardHeader>
            <CardContent className="grid gap-4">
              <p className="whitespace-pre-line">{c.summary}</p>
              <Thread tz="UTC" items={updates.map((u) => ({ ...u.u, author: u.author }))} />
              {c.resolution && <Alert tone="info">Resolution: {c.resolution}</Alert>}
            </CardContent>
            {c.status !== "resolved" && (
              <CardFooter>
                <form action={caseUpdateAction} className="grid w-full gap-2">
                  <input type="hidden" name="caseId" value={c.id} />
                  <input type="hidden" name="back" value="staff" />
                  <TextArea label="Reply to the reporter" name="body" rows={2} />
                  <Button size="sm" variant="secondary" className="justify-self-start">Send reply</Button>
                </form>
              </CardFooter>
            )}
          </Card>
          {c.status !== "resolved" && (
            <Card className="border-primary/40">
              <form action={resolveCaseAction}>
                <CardHeader>
                  <CardTitle className="text-base">Resolve</CardTitle>
                  <CardDescription>
                    The reporter reads your resolution. Actions are logged with your name and reason.
                    {c.type === "appeal" && " Appeals need someone who wasn't part of the original decision."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 pt-4">
                  <input type="hidden" name="caseId" value={c.id} />
                  <SelectField label="Action" name="action" defaultValue="none" options={actions} />
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Days to extend" name="days" type="number" min={1} max={60} defaultValue={c.requestedDays ?? 7} />
                    {mentors.length > 0 && <SelectField label="New mentor" name="mentorId" placeholder="Only if replacing" options={mentors.map((m) => ({ value: m.id, label: m.name }))} />}
                  </div>
                  <TextArea label="Resolution" name="resolution" rows={3} required minLength={10} />
                </CardContent>
                <CardFooter className="mt-4"><Button type="submit">Resolve case</Button></CardFooter>
              </form>
            </Card>
          )}
        </div>
        <aside className="grid h-fit gap-4">
          {e && (
            <Card>
              <CardHeader>
                <CardDescription>Project</CardDescription>
                <CardTitle className="text-base">{e.title}</CardTitle>
                <CardAction><EnrollmentBadge state={e.e.state} /></CardAction>
              </CardHeader>
              <CardContent>
                <Button asChild size="sm" variant="outline"><Link href={`/workspace/${e.e.id}`}>Open workspace (logged)</Link></Button>
              </CardContent>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Owner</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              <p>{c.ownerId ? (c.ownerId === me.id ? "You" : "Another staff member") : "Unassigned"}. Reply by {when(c.dueAt)}.</p>
              {c.status !== "resolved" && c.ownerId !== me.id && (
                <form action={takeCaseAction}><input type="hidden" name="caseId" value={c.id} /><Button size="sm" variant="secondary">Assign to me</Button></form>
              )}
            </CardContent>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
