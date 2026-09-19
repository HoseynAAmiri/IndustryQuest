import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, desc, eq, or } from "drizzle-orm";
import { auditEvents, briefVersions, credentials, enrollments, equivalencies, skills, studentProfiles, user } from "@iq/db";
import { ConfirmForm } from "@/components/confirm";
import { Alert, Button, EnrollmentBadge, Field, Page, SelectField, TextArea, messages, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { correctAction, equivalencyAction, exceptionAction, revokeAction } from "../../actions";

export default async function StudentDetail({ params, searchParams }: PageProps<"/staff/students/[id]">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) notFound();
  const { error } = await messages(searchParams);
  const id = (await params).id;
  const [row] = await db.select({ u: user, p: studentProfiles }).from(studentProfiles).innerJoin(user, eq(user.id, studentProfiles.userId)).where(eq(user.id, id));
  if (!row) notFound();
  const [mine, creds, eqs, allSkills, trail] = await Promise.all([
    db.select({ e: enrollments, title: briefVersions.title }).from(enrollments).innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
      .where(eq(enrollments.studentId, id)).orderBy(desc(enrollments.updatedAt)),
    db.select().from(credentials).where(eq(credentials.userId, id)).orderBy(desc(credentials.issuedAt)),
    db.select({ q: equivalencies, skill: skills.name, by: user.name }).from(equivalencies).innerJoin(skills, eq(skills.id, equivalencies.skillId))
      .innerJoin(user, eq(user.id, equivalencies.grantedBy)).where(eq(equivalencies.userId, id)),
    db.select().from(skills).orderBy(asc(skills.name)),
    db.select({ a: auditEvents, actor: user.name }).from(auditEvents).leftJoin(user, eq(user.id, auditEvents.actorId))
      .where(or(eq(auditEvents.targetId, id), eq(auditEvents.actorId, id))).orderBy(desc(auditEvents.createdAt)).limit(20),
  ]);
  const back = { href: "/staff/students", label: "Students" };
  return (
    <Page title={row.u.name} description={`${row.u.email} · ${row.p.discipline || "no discipline"} · ${row.p.timezone}`} back={back}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle><CardDescription>Opening a workspace is logged.</CardDescription></CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {mine.map((m) => (
                <li key={m.e.id} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                  <Link href={`/workspace/${m.e.id}`} className="flex-1 font-medium hover:underline">{m.title}</Link>
                  <EnrollmentBadge state={m.e.state} />
                </li>
              ))}
              {!mine.length && <li className="p-4 text-sm text-muted-foreground">No applications yet.</li>}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Project limit</CardTitle>
            <CardDescription>Default is 2 at once. Exceptions need a reason and are logged (ENR-07).{row.p.extraSlotsReason && ` Current: +${row.p.extraActiveSlots}, "${row.p.extraSlotsReason}"`}</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={exceptionAction} className="grid gap-3 sm:grid-cols-[8rem_1fr] sm:items-end">
              <input type="hidden" name="userId" value={id} />
              <SelectField label="Extra places" name="slots" defaultValue={String(row.p.extraActiveSlots)} options={[0, 1, 2, 3].map((n) => ({ value: String(n), label: `+${n}` }))} />
              <Field label="Reason" name="reason" required minLength={10} />
              <Button size="sm" variant="secondary" className="justify-self-start">Save exception</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Equivalency reviews</CardTitle>
            <CardDescription>Outside evidence that satisfies a prerequisite. It unlocks projects but never creates a credential or skill tier (AC-22).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <ul className="grid gap-2 text-sm">
              {eqs.map(({ q, skill, by }) => <li key={q.id}><span className="font-medium">{skill}</span> · accepted by {by} on {when(q.createdAt)}: {q.evidence}</li>)}
              {!eqs.length && <li className="text-muted-foreground">None recorded.</li>}
            </ul>
            <form action={equivalencyAction} className="grid gap-3">
              <input type="hidden" name="userId" value={id} />
              <SelectField label="Skill" name="skillId" placeholder="Choose a skill" options={allSkills.map((s) => ({ value: s.id, label: s.name }))} />
              <TextArea label="Evidence you accepted" name="evidence" rows={2} required minLength={10} />
              <Button size="sm" variant="secondary" className="justify-self-start">Record equivalency</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Credentials</CardTitle>
            <CardDescription>Revoking reverses the XP with a linked correction and updates skill tiers. The student sees the reason and can appeal (AC-15).</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {creds.map((c) => (
              <div key={c.id} className="grid gap-2 rounded-lg border p-3 text-sm">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="flex-1 font-medium">{c.title}</span>
                  <Badge variant={c.status === "active" ? "default" : "destructive"}>{c.status}</Badge>
                </div>
                {c.status === "active" && (
                  <div className="grid gap-2 sm:grid-cols-2">
                    <ConfirmForm action={revokeAction} fields={{ userId: id, credentialId: c.id }} className="grid gap-2" size="sm" variant="outline"
                      extra={<Field label="Reason for revoking" name="reason" required minLength={10} />}
                      ask={{ title: `Revoke "${c.title}"?`, description: "The public page will show it as revoked. XP and skill tiers update now. The student is told why.", confirm: "Revoke", destructive: true }}>
                      Revoke
                    </ConfirmForm>
                    <form action={correctAction} className="grid gap-2">
                      <input type="hidden" name="userId" value={id} /><input type="hidden" name="credentialId" value={c.id} />
                      <Field label="Corrected summary" name="summary" defaultValue={c.summary} />
                      <Field label="Reason" name="reason" required minLength={10} />
                      <Button size="sm" variant="ghost" className="justify-self-start">Correct</Button>
                    </form>
                  </div>
                )}
              </div>
            ))}
            {!creds.length && <p className="text-sm text-muted-foreground">No credentials.</p>}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>Audit trail</CardTitle><CardDescription>Recent decisions about or by this person.</CardDescription></CardHeader>
          <CardContent>
            <ul className="grid gap-1 text-sm">
              {trail.map(({ a, actor }) => (
                <li key={a.id}><span className="text-muted-foreground">{when(a.createdAt, "UTC", true)}</span> · {actor ?? "System"} · {a.action.replaceAll("_", " ")}{a.reason && `: ${a.reason}`}</li>
              ))}
              {!trail.length && <li className="text-muted-foreground">Nothing recorded.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
