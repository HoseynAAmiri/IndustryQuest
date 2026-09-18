import Link from "next/link";
import { asc, eq, isNull } from "drizzle-orm";
import { briefVersions, organizations, projects } from "@iq/db";
import { Alert, Button, Page, messages } from "@/components/ui";
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
  const queue = await db.select({ id: projects.id, title: briefVersions.title, org: organizations.name, since: projects.updatedAt })
    .from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .innerJoin(organizations, eq(organizations.id, projects.orgId))
    .where(eq(projects.state, "in_review")).orderBy(asc(projects.updatedAt));
  return (
    <Page title="Staff queue">
      <div className="mb-4 space-y-2"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
      <section className="mb-8">
        <h2 className="mb-2 text-lg font-semibold">Briefs waiting for review ({queue.length})</h2>
        <ul className="divide-y rounded border">
          {queue.map((q) => (
            <li key={q.id} className="p-3">
              <Link href={`/staff/projects/${q.id}`} className="text-blue-700 underline">{q.title}</Link>
              <span className="text-sm text-slate-600"> · {q.org} · submitted {q.since.toISOString().slice(0, 10)}</span>
            </li>
          ))}
          {!queue.length && <li className="p-3 text-slate-600">Nothing to review.</li>}
        </ul>
      </section>
      <section>
        <h2 className="mb-2 text-lg font-semibold">Organizations to verify ({orgs.length})</h2>
        <p className="mb-2 text-sm text-slate-600">Verify only after checking the organization and its contact outside the platform.</p>
        <ul className="divide-y rounded border">
          {orgs.map((o) => (
            <li key={o.id} className="flex items-center justify-between p-3">
              <span>{o.name}</span>
              <form action={verify}><input type="hidden" name="orgId" value={o.id} /><Button>Mark verified</Button></form>
            </li>
          ))}
          {!orgs.length && <li className="p-3 text-slate-600">No organizations waiting.</li>}
        </ul>
      </section>
    </Page>
  );
}
