import Link from "next/link";
import { CircleCheck, Clock, ListChecks, Pencil } from "lucide-react";
import { briefSchema, canPublish } from "@iq/core";
import { eq } from "drizzle-orm";
import { skills, user } from "@iq/db";
import { ConfirmForm } from "@/components/confirm";
import { BriefView } from "@/components/brief-view";
import { Alert, Button, Field, ListingBadge, Page, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { seatsTaken } from "@/server/discovery";
import { loadProject } from "@/server/projects";
import { listingAction } from "../../actions";
import { Applicants } from "../../applicants";
import { BriefForm } from "../../brief-form";
import { formOptions } from "../../data";

export default async function EditBrief({ params, searchParams }: PageProps<"/company/projects/[id]">) {
  const me = await requireUser();
  const { error } = await messages(searchParams);
  const revising = (await searchParams).edit === "1";
  const db = getDb();
  const { project, brief, org } = await loadProject(db, (await params).id).catch(() => ({ project: null, brief: null, org: null }));
  if (!project || !(await getRoles(db, me.id)).ownerOf.includes(project.orgId))
    return <Page title="Brief"><Alert>This brief doesn't exist or you don't have access.</Alert></Page>;
  const b = briefSchema.parse(brief.content);
  const live = project.state === "published" || project.state === "paused";
  const editable = project.state === "draft" || project.state === "changes_requested";
  const blockers = canPublish(b, { verified: !!org.verifiedAt, mentorConfirmed: !!project.mentorConfirmedAt });
  const [mentor] = brief.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, brief.mentorId)) : [];
  const page = {
    title: brief.title || "Untitled draft", back: { href: "/company", label: "Company projects" },
    actions: <div className="flex items-center gap-2">
      {live && !revising && <Button asChild variant="outline" size="sm"><Link href={`/company/projects/${project.id}?edit=1`}><Pencil /> Publish a new version</Link></Button>}
      <ListingBadge state={project.state} />
    </div>,
  };

  const header = (
    <div className="mb-6 grid gap-3">
      <Alert>{error}</Alert>
      {project.state === "changes_requested" && <Alert>Staff asked for changes: {project.reviewNote}</Alert>}
      {brief.mentorId && !project.mentorConfirmedAt && (
        <Alert tone="info"><span className="inline-flex items-center gap-1"><Clock className="size-4" /> Waiting for {mentor?.name} to confirm they'll mentor this project.</span></Alert>
      )}
      {project.stateReason && project.state !== "published" && <Alert tone="info">Listing {project.state}: {project.stateReason}</Alert>}
      {editable && (blockers.length ? (
        <Card className="border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20">
          <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks className="size-5 text-amber-600" /> Still needed before you can submit</CardTitle></CardHeader>
          <CardContent><ul className="list-disc space-y-1 pl-5">{blockers.map((x) => <li key={x}>{x}</li>)}</ul></CardContent>
        </Card>
      ) : (
        <Alert tone="info"><span className="inline-flex items-center gap-1"><CircleCheck className="size-4" /> Everything required is filled in. You can submit this brief for review.</span></Alert>
      ))}
    </div>
  );

  if (editable || (live && revising))
    return (
      <Page {...page} description={revising ? `Version ${brief.version} stays on record. Students already working keep it unless they accept the change.` : undefined}
        back={revising ? { href: `/company/projects/${project.id}`, label: "Back to the brief" } : page.back}>
        {header}
        <BriefForm orgId={project.orgId} projectId={project.id} b={b} revise={revising} {...await formOptions(db, project.orgId)} />
      </Page>
    );

  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  return (
    <Page {...page} description={project.state === "in_review" ? "Staff are reviewing this brief. It can't be edited meanwhile." : `Version ${brief.version}`}>
      {header}
      {["published", "paused", "closed"].includes(project.state) && (
        <div className="mb-8 grid gap-6">
          <Applicants db={db} projectId={project.id} capacity={brief.capacity}
            openPlaces={Math.max(0, brief.capacity - ((await seatsTaken(db, [project.id])).get(project.id) ?? 0))} />
          {live && (
            <Card>
              <CardHeader>
                <CardTitle>Listing</CardTitle>
                <CardDescription>Pausing or closing stops new applications. Students already working carry on, and applicants are told why.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-3">
                {project.state === "published" ? (
                  <>
                    <ConfirmForm action={listingAction} fields={{ projectId: project.id, action: "pause" }} className="flex flex-1 flex-wrap items-end gap-2" variant="outline"
                      extra={<div className="min-w-56 flex-1"><Field label="Reason (applicants see it)" name="reason" required minLength={5} /></div>}
                      ask={{ title: "Pause applications?", description: "New applications stop until you reopen. People who applied are told the reason.", confirm: "Pause" }}>
                      Pause applications
                    </ConfirmForm>
                  </>
                ) : (
                  <form action={listingAction}>
                    <input type="hidden" name="projectId" value={project.id} />
                    <input type="hidden" name="action" value="resume" />
                    <Button>Reopen applications</Button>
                  </form>
                )}
                <ConfirmForm action={listingAction} fields={{ projectId: project.id, action: "close", reason: "The company closed this listing." }} variant="ghost"
                  ask={{ title: "Close this listing?", description: "It won't take applications again. Current students keep working and keep their records.", confirm: "Close listing", destructive: true }}>
                  Close listing
                </ConfirmForm>
              </CardContent>
            </Card>
          )}
        </div>
      )}
      <h2 className="mb-3 text-lg font-semibold">Current brief</h2>
      <BriefView b={b} orgName={org.name} mentorName={mentor?.name} skillNames={names} />
    </Page>
  );
}
