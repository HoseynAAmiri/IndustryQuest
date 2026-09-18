import { canPublish } from "@iq/core";
import { eq } from "drizzle-orm";
import { skills, user } from "@iq/db";
import { BriefView } from "@/components/brief-view";
import { Alert, Button, Page, TextArea, messages } from "@/components/ui";
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
    <Page title={`Review: ${brief.title}`} back={{ href: "/staff", label: "Staff queue" }}>
      <div className="mb-6 space-y-2">
        <Alert>{error}</Alert>
        {blockers.length > 0 && <Alert>Automatic checks failed: {blockers.join(" ")}</Alert>}
      </div>
      <BriefView b={brief.content} orgName={org.name} mentorName={mentor?.name} skillNames={names} />
      {project.state === "in_review" ? (
        <form action={review} className="mt-8 space-y-4 rounded border p-4">
          <input type="hidden" name="projectId" value={project.id} />
          <h2 className="text-lg font-semibold">Quality gate (PRD §9.2)</h2>
          <p className="text-sm text-slate-600">Confirm each point before approving. If any fails, request changes and say why.</p>
          <ul className="list-disc pl-6">{GATE.map((g) => <li key={g}>{g}</li>)}</ul>
          <TextArea label="Note to the owner" name="note" hint="Required when requesting changes." />
          <div className="flex gap-3">
            <Button name="decision" value="approve" className="bg-green-800 hover:bg-green-900">Approve and publish</Button>
            <Button name="decision" value="changes">Request changes</Button>
          </div>
        </form>
      ) : <p className="mt-6">This brief is {project.state}, so there is nothing to review.</p>}
    </Page>
  );
}
