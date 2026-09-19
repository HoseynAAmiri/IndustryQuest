import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { and, eq, inArray, sql } from "drizzle-orm";
import { BadgeCheck } from "lucide-react";
import { briefVersions, enrollments, organizations, projects } from "@iq/db";
import { Page } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Company" };

// ORG-01: who they are, what staff checked, what they offer and how much they've taken part.
export default async function Company({ params }: PageProps<"/companies/[id]">) {
  const db = getDb();
  const [org] = await db.select().from(organizations).where(eq(organizations.id, (await params).id)).catch(() => []);
  if (!org) notFound();
  const live = await db.select({ id: projects.id, title: briefVersions.title, summary: briefVersions.summary, tier: briefVersions.tier }).from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId)).where(and(eq(projects.orgId, org.id), eq(projects.state, "published")));
  const [{ done, students }] = await db.select({ done: sql<number>`count(*)::int`, students: sql<number>`count(distinct ${enrollments.studentId})::int` })
    .from(enrollments).innerJoin(projects, eq(projects.id, enrollments.projectId))
    .where(and(eq(projects.orgId, org.id), inArray(enrollments.state, ["completed"])));
  return (
    <Page title={org.name} description={org.description}
      actions={org.verifiedAt ? <Badge className="gap-1"><BadgeCheck className="size-3" /> Verified</Badge> : <Badge variant="outline">Not verified yet</Badge>}>
      <div className="grid gap-6 md:grid-cols-[1fr_18rem]">
        <Card>
          <CardHeader><CardTitle>Open projects</CardTitle></CardHeader>
          <CardContent className="grid gap-3">
            {live.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="press rounded-lg border p-3 hover:bg-muted/50">
                <span className="block font-medium">{p.title} <span className="font-normal text-muted-foreground">· {p.tier}</span></span>
                <span className="text-sm text-muted-foreground">{p.summary}</span>
              </Link>
            ))}
            {!live.length && <p className="text-sm text-muted-foreground">No open projects right now.</p>}
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle className="text-base">Track record</CardTitle></CardHeader>
          <CardContent className="grid gap-2 text-sm">
            <p>{done} verified {done === 1 ? "project" : "projects"} completed by {students} {students === 1 ? "student" : "students"}.</p>
            {org.verifiedAt && <CardDescription>What staff checked: {org.verificationNote ?? "organization and contact details"}. Verification doesn't certify every professional claim.</CardDescription>}
          </CardContent>
        </Card>
      </div>
    </Page>
  );
}
