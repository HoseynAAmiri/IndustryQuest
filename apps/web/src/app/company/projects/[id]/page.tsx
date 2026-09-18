import { canPublish } from "@iq/core";
import { eq } from "drizzle-orm";
import { skills, user } from "@iq/db";
import { BriefView } from "@/components/brief-view";
import { Alert, Page, messages } from "@/components/ui";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { loadProject } from "@/server/projects";
import { BriefForm } from "../../brief-form";
import { formOptions } from "../../data";

export default async function EditBrief({ params, searchParams }: PageProps<"/company/projects/[id]">) {
  const me = await requireUser();
  const { error, info } = await messages(searchParams);
  const db = getDb();
  const { project, brief, org } = await loadProject(db, (await params).id).catch(() => ({ project: null, brief: null, org: null }));
  if (!project || !(await getRoles(db, me.id)).ownerOf.includes(project.orgId))
    return <Page title="Brief"><Alert>This brief doesn't exist or you don't have access.</Alert></Page>;
  const editable = project.state === "draft" || project.state === "changes_requested";
  const blockers = canPublish(brief.content, { verified: !!org.verifiedAt });
  const back = { href: "/company", label: "Company projects" };

  const header = (
    <div className="mb-6 space-y-3">
      <Alert>{error}</Alert>
      <Alert tone="info">{info}</Alert>
      {project.state === "changes_requested" && <Alert>Staff asked for changes: {project.reviewNote}</Alert>}
      {editable && (blockers.length ? (
        <div className="rounded border border-amber-600 bg-amber-50 p-3">
          <h2 className="font-semibold">Still needed before you can submit</h2>
          <ul className="list-disc pl-6">{blockers.map((b) => <li key={b}>{b}</li>)}</ul>
        </div>
      ) : <Alert tone="info">Everything required is filled in. You can submit this brief for review.</Alert>)}
    </div>
  );

  if (editable)
    return (
      <Page title={brief.title || "Untitled draft"} back={back}>
        {header}
        <BriefForm orgId={project.orgId} projectId={project.id} b={brief.content} {...await formOptions(db, project.orgId)} />
      </Page>
    );

  const [mentor] = brief.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, brief.mentorId)) : [];
  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  return (
    <Page title={brief.title} back={back}>
      {header}
      <p className="mb-4 text-slate-700">
        {project.state === "in_review" ? "Staff are reviewing this brief. It can't be edited meanwhile." : `Status: ${project.state}.`}
      </p>
      <BriefView b={brief.content} orgName={org.name} mentorName={mentor?.name} skillNames={names} />
    </Page>
  );
}
