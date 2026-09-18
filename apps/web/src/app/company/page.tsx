import Link from "next/link";
import { desc, eq, inArray } from "drizzle-orm";
import { briefVersions, organizations, projects } from "@iq/db";
import { Alert, Page } from "@/components/ui";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

const STATE = {
  draft: "Draft", in_review: "In staff review", changes_requested: "Changes requested", published: "Published",
  paused: "Paused", closed: "Closed", archived: "Archived",
} as const;

export default async function Company() {
  const user = await requireUser();
  const db = getDb();
  const { ownerOf } = await getRoles(db, user.id);
  if (!ownerOf.length) return <Page title="Company"><Alert>You aren't an owner in any organization.</Alert></Page>;
  const orgs = await db.select().from(organizations).where(inArray(organizations.id, ownerOf));
  const rows = await db.select({ p: projects, title: briefVersions.title }).from(projects)
    .innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .where(inArray(projects.orgId, ownerOf)).orderBy(desc(projects.updatedAt));
  return (
    <Page title="Company projects">
      {orgs.map((org) => (
        <section key={org.id} className="mb-8">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-lg font-semibold">{org.name}</h2>
            <Link href={`/company/projects/new?org=${org.id}`} className="rounded bg-blue-700 px-3 py-1.5 text-white">New brief</Link>
          </div>
          {!org.verifiedAt && <Alert tone="info">Staff haven't verified this organization yet. You can write drafts, but you can't submit them.</Alert>}
          <ul className="divide-y rounded border">
            {rows.filter((r) => r.p.orgId === org.id).map(({ p, title }) => (
              <li key={p.id} className="flex items-center justify-between p-3">
                <Link href={`/company/projects/${p.id}`} className="text-blue-700 underline">{title || "Untitled draft"}</Link>
                <span className="text-sm">{STATE[p.state]}</span>
              </li>
            ))}
            {!rows.some((r) => r.p.orgId === org.id) && <li className="p-3 text-slate-600">No briefs yet. Start with “New brief”.</li>}
          </ul>
        </section>
      ))}
    </Page>
  );
}
