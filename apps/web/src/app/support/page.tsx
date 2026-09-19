import type { Metadata } from "next";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { LifeBuoy } from "lucide-react";
import { briefVersions, caseUpdates, cases, enrollments, studentProfiles, user } from "@iq/db";
import { CaseStatus, Thread } from "@/components/case-list";
import { Alert, Button, Page, TextArea, messages, when } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { CASE_TYPES } from "@/server/cases";
import { getDb } from "@/server/db";
import { caseUpdateAction, openCaseAction } from "./actions";

export const metadata: Metadata = { title: "Support" };

// OPS-09: every request gets a reference number, a reply-by date and a visible status.
export default async function Support({ searchParams }: PageProps<"/support">) {
  const me = await requireUser();
  const db = getDb();
  const { error } = await messages(searchParams);
  const [p] = await db.select({ tz: studentProfiles.timezone }).from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  const tz = p?.tz ?? "UTC";
  const mine = await db.select({ c: cases, project: briefVersions.title }).from(cases)
    .leftJoin(enrollments, eq(enrollments.id, cases.enrollmentId))
    .leftJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .where(eq(cases.reporterId, me.id)).orderBy(desc(cases.createdAt));
  const updates = mine.length ? await db.select({ u: caseUpdates, author: user.name }).from(caseUpdates)
    .innerJoin(user, eq(user.id, caseUpdates.authorId)).where(inArray(caseUpdates.caseId, mine.map((m) => m.c.id))).orderBy(asc(caseUpdates.createdAt)) : [];

  return (
    <Page title="Support" description="Your requests to program staff. Only you and staff can see them.">
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <div className="grid h-fit gap-4">
          {mine.map(({ c, project }) => (
            <Card key={c.id}>
              <CardHeader>
                <CardDescription>#{c.number} · {CASE_TYPES[c.type]}{project && ` · ${project}`}</CardDescription>
                <CardTitle className="text-base font-normal">{c.summary}</CardTitle>
                <CardAction><CaseStatus s={c.status} /></CardAction>
              </CardHeader>
              <CardContent className="grid gap-3">
                <p className="text-sm text-muted-foreground">
                  Opened {when(c.createdAt, tz)} · {c.status === "resolved" ? `resolved ${when(c.resolvedAt, tz)}` : `reply expected by ${when(c.dueAt, tz)}`}
                </p>
                <Thread tz={tz} items={updates.filter((u) => u.u.caseId === c.id).map((u) => ({ ...u.u, author: u.author }))} />
                {c.resolution && <Alert tone="info">Resolution: {c.resolution}</Alert>}
              </CardContent>
              {c.status !== "resolved" && (
                <CardFooter>
                  <form action={caseUpdateAction} className="grid w-full gap-2">
                    <input type="hidden" name="caseId" value={c.id} />
                    <TextArea label="Add information" name="body" rows={2} />
                    <Button size="sm" variant="secondary" className="justify-self-start">Send update</Button>
                  </form>
                </CardFooter>
              )}
            </Card>
          ))}
          {!mine.length && (
            <Card><CardContent className="grid justify-items-center gap-2 py-10 text-center text-muted-foreground">
              <LifeBuoy className="size-7" /><p>No requests yet. Problems with a project are best raised from its workspace.</p>
            </CardContent></Card>
          )}
        </div>
        <Card className="h-fit">
          <form action={openCaseAction}>
            <CardHeader>
              <CardTitle className="text-base">Ask for help</CardTitle>
              <CardDescription>Account problems or questions. For a project, use “Stuck or worried?” in its workspace.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
              <input type="hidden" name="type" value="support" />
              <TextArea label="What do you need?" name="summary" rows={4} required minLength={10} />
            </CardContent>
            <CardFooter className="mt-4"><Button type="submit">Send request</Button></CardFooter>
          </form>
        </Card>
      </div>
    </Page>
  );
}
