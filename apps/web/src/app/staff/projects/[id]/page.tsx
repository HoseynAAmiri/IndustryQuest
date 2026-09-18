import { Check } from "lucide-react";
import { canPublish } from "@iq/core";
import { eq } from "drizzle-orm";
import { skills, user } from "@iq/db";
import { BriefView } from "@/components/brief-view";
import { Alert, Button, ListingBadge, Page, TextArea, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { loadProject } from "@/server/projects";
import { review } from "../../actions";

const GATE = [
  "The problem is real and the company may share the resources.",
  "The deliverable fits the stated effort and support.",
  "The project teaches something specific and produces evidence that can be assessed.",
  "The mentor agreed to support the number of places offered.",
  "Rubric, compensation, confidentiality and ownership terms are clear before anyone accepts.",
  "Students won't need to guess hidden expectations or pay undisclosed costs.",
  "Completion can be assessed even if the company doesn't use the output.",
];

export default async function StaffReview({ params, searchParams }: PageProps<"/staff/projects/[id]">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Review"><Alert>Staff only.</Alert></Page>;
  const { error } = await messages(searchParams);
  const { project, brief, org } = await loadProject(db, (await params).id);
  const [mentor] = brief.mentorId ? await db.select({ name: user.name }).from(user).where(eq(user.id, brief.mentorId)) : [];
  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  const blockers = canPublish(brief.content, { verified: !!org.verifiedAt });
  return (
    <Page title={brief.title} description={`Review for ${org.name}`} back={{ href: "/staff", label: "Staff queue" }} actions={<ListingBadge state={project.state} />}>
      <div className="mb-6 grid gap-3">
        <Alert>{error}</Alert>
        {blockers.length > 0 && <Alert>Automatic checks failed: {blockers.join(" ")}</Alert>}
      </div>
      <BriefView b={brief.content} orgName={org.name} mentorName={mentor?.name} skillNames={names} />
      {project.state === "in_review" && (
        <Card className="mt-6 border-primary/40">
          <form action={review}>
            <CardHeader>
              <CardTitle>Quality gate</CardTitle>
              <CardDescription>Confirm each point before approving (PRD §9.2). If one fails, request changes and say why.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 pt-4">
              <input type="hidden" name="projectId" value={project.id} />
              <ul className="grid gap-2">
                {GATE.map((g) => <li key={g} className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden />{g}</li>)}
              </ul>
              <TextArea label="Note to the owner" name="note" hint="Required when requesting changes." rows={3} />
            </CardContent>
            <CardFooter className="mt-4 gap-2">
              <Button name="decision" value="approve">Approve and publish</Button>
              <Button name="decision" value="changes" variant="outline">Request changes</Button>
            </CardFooter>
          </form>
        </Card>
      )}
    </Page>
  );
}
