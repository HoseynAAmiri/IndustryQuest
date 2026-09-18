import Link from "next/link";
import { asc, eq, isNull } from "drizzle-orm";
import { BadgeCheck, ChevronRight } from "lucide-react";
import { briefVersions, organizations, projects } from "@iq/db";
import { Alert, Button, Page, messages } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { verify } from "./actions";

export default async function Staff({ searchParams }: PageProps<"/staff">) {
  const user = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, user.id)).isStaff) return <Page title="Staff"><Alert>Staff only.</Alert></Page>;
  const { error, info } = await messages(searchParams);
  const orgs = await db.select().from(organizations).where(isNull(organizations.verifiedAt)).orderBy(asc(organizations.createdAt));
  const queue = await db.select({ id: projects.id, title: briefVersions.title, tier: briefVersions.tier, org: organizations.name, since: projects.updatedAt })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(projects.state, "in_review")).orderBy(asc(projects.updatedAt));
  return (
    <Page title="Staff queue" description="Briefs to check before they go live, and organizations to verify.">
      <div className="mb-6 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Briefs waiting for review <Badge variant="secondary">{queue.length}</Badge></CardTitle>
            <CardDescription>Oldest first.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {queue.map((q) => (
                <li key={q.id}>
                  <Link href={`/staff/projects/${q.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
                    <span className="flex-1">
                      <span className="block font-medium">{q.title}</span>
                      <span className="text-sm text-muted-foreground">{q.org} · {q.tier} · submitted {q.since.toISOString().slice(0, 10)}</span>
                    </span>
                    <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                  </Link>
                </li>
              ))}
              {!queue.length && <li className="p-6 text-center text-muted-foreground">Nothing to review.</li>}
            </ul>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">Organizations to verify <Badge variant="secondary">{orgs.length}</Badge></CardTitle>
            <CardDescription>Verify only after checking the organization and its contact outside the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y rounded-lg border">
              {orgs.map((o) => (
                <li key={o.id} className="flex items-center justify-between gap-3 p-3">
                  <span className="font-medium">{o.name}</span>
                  <form action={verify}><input type="hidden" name="orgId" value={o.id} /><Button size="sm" variant="outline"><BadgeCheck /> Mark verified</Button></form>
                </li>
              ))}
              {!orgs.length && <li className="p-6 text-center text-muted-foreground">No organizations waiting.</li>}
            </ul>
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
