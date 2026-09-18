import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { ChevronRight, FilePlus2 } from "lucide-react";
import { briefVersions, organizations, projects } from "@iq/db";
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
  return (
    <Page title="Company projects" description="Draft briefs, send them for review, and follow them once they're live.">
      <div className="grid gap-6">
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
                      <Link href={`/company/projects/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/50 focus-visible:outline-2 focus-visible:outline-ring">
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
