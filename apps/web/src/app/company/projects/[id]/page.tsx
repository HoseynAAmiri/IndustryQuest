import { CircleCheck, ListChecks } from "lucide-react";
import { canPublish } from "@iq/core";
import { eq } from "drizzle-orm";
import { skills, user } from "@iq/db";
import { BriefView } from "@/components/brief-view";
import { Alert, ListingBadge, Page, messages } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const page = { title: brief.title || "Untitled draft", back: { href: "/company", label: "Company projects" }, actions: <ListingBadge state={project.state} /> };

  const header = (
    <div className="mb-6 grid gap-3">
      <Alert>{error}</Alert>
      <Alert tone="info">{info}</Alert>
      {project.state === "changes_requested" && <Alert>Staff asked for changes: {project.reviewNote}</Alert>}
      {editable && (blockers.length ? (
        <Card className="border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-5 text-amber-600" /> Still needed before you can submit</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5">{blockers.map((b) => <li key={b}>{b}</li>)}</ul></CardContent>
        </Card>
      ) : (
        <Alert tone="info"><span className="inline-flex items-center gap-1"><CircleCheck className="size-4" /> Everything required is filled in. You can submit this brief for review.</span></Alert>
      ))}
    </div>
  );

  if (editable)
    return (
      <Page {...page}>
        {header}
        <BriefForm orgId={project.orgId} projectId={project.id} b={brief.content} {...await formOptions(db, project.orgId)} />
      </Page>
    );

  const [mentor] = brief.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, brief.mentorId)) : [];
  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  return (
    <Page {...page} description={project.state === "in_review" ? "Staff are reviewing this brief. It can't be edited meanwhile." : undefined}>
      {header}
      <BriefView b={brief.content} orgName={org.name} mentorName={mentor?.name} skillNames={names} />
    </Page>
  );
}
