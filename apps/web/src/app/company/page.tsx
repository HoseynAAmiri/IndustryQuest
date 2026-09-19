import Link from "next/link";
import { and, desc, eq, inArray } from "drizzle-orm";
import { ChevronRight, FilePlus2 } from "lucide-react";
import { briefVersions, credentials, enrollments, organizations, projects, user as users } from "@iq/db";
import { summaryReviewAction } from "./actions";
import { TextArea } from "@/components/ui";
import { Alert, Button, ListingBadge, Page } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

export default async function Company() {
  const user = await requireUser();
  const db = getDb();
  const { ownerOf } = await getRoles(db, user.id);
  if (!ownerOf.length) return <Page title="Company"><Alert>You aren't an owner in any organization.</Alert></Page>;
  const orgs = await db.select().from(organizations).where(inArray(organizations.id, ownerOf));
  const rows = await db.select({ p: projects, title: briefVersions.title, tier: briefVersions.tier }).from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .where(inArray(projects.orgId, ownerOf)).orderBy(desc(projects.updatedAt));
  const pending = await db.select({ c: credentials, title: briefVersions.title, student: users.name }).from(credentials)
    .innerJoin(enrollments, eq(enrollments.id, credentials.enrollmentId)).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId)).innerJoin(users, eq(users.id, credentials.userId))
    .where(and(inArray(projects.orgId, ownerOf), eq(credentials.summaryStatus, "pending")));
  return (
    <Page title="Company projects" description="Draft briefs, send them for review, and follow them once they're live."
      actions={<Button asChild variant="outline" size="sm"><Link href="/company/team">Team</Link></Button>}>
      <div className="grid gap-6">
        {pending.length > 0 && (
          <Card id="portfolio" className="border-primary/50">
            <CardHeader>
              <CardTitle>Portfolio summaries to approve ({pending.length})</CardTitle>
              <CardDescription>Students want to show their contribution publicly. Approve if it holds nothing confidential (CRD-03).</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3">
              {pending.map((p) => (
                <form key={p.c.id} action={summaryReviewAction} className="grid gap-2 rounded-lg border p-3 text-sm">
                  <input type="hidden" name="credentialId" value={p.c.id} />
                  <p className="font-medium">{p.student} · {p.title}</p>
                  <p className="rounded-md bg-muted/50 p-2">{p.c.proposedSummary}</p>
                  <TextArea label="Note (needed if you ask for changes)" name="note" rows={2} />
                  <div className="flex gap-2">
                    <Button size="sm" name="decision" value="approve">Approve</Button>
                    <Button size="sm" name="decision" value="decline" variant="outline">Ask for changes</Button>
                  </div>
                </form>
              ))}
            </CardContent>
          </Card>
        )}
        {orgs.map((org) => {
          const mine = rows.filter((r) => r.p.orgId === org.id);
          return (
            <Card key={org.id}>
              <CardHeader>
                <CardTitle>{org.name}</CardTitle>
                <CardDescription>{mine.length} {mine.length === 1 ? "brief" : "briefs"}</CardDescription>
                <CardAction>
                  <Button asChild size="sm"><Link href={`/company/projects/new?org=${org.id}`}><FilePlus2 /> New brief</Link></Button>
                </CardAction>
              </CardHeader>
              <CardContent className="grid gap-4">
                {!org.verifiedAt && <Alert tone="info">Staff haven't verified this organization yet. You can write drafts, but you can't submit them.</Alert>}
                <ul className="divide-y rounded-lg border">
                  {mine.map(({ p, title, tier }) => (
                    <li key={p.id}>
                      <Link href={`/company/projects/${p.id}`} className="press flex items-center gap-3 p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
                        <span className="flex-1 font-medium">{title || "Untitled draft"}</span>
                        <span className="text-sm text-muted-foreground">{tier}</span>
                        <ListingBadge state={p.state} />
                        <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                      </Link>
                    </li>
                  ))}
                  {!mine.length && <li className="p-6 text-center text-muted-foreground">No briefs yet. Start with “New brief”.</li>}
                </ul>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
