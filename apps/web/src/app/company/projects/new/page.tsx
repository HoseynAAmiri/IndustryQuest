import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { briefSchema, type Brief } from "@iq/core";
import { rubricTemplates } from "@iq/db";
import { Alert, Button, Page, messages } from "@/components/ui";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { BriefForm } from "../../brief-form";
import { formOptions } from "../../data";

export default async function NewBrief({ searchParams }: PageProps<"/company/projects/new">) {
  const user = await requireUser();
  const { error } = await messages(searchParams);
  const org = String((await searchParams).org ?? "");
  const db = getDb();
  if (!(await getRoles(db, user.id)).ownerOf.includes(org)) return <Page title="New brief"><Alert>You can't create briefs for this organization.</Alert></Page>;
  const kind = String((await searchParams).template ?? "");
  const rubricId = String((await searchParams).rubric ?? "");
  const deadline = new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10);
  const base = { title: "", summary: "", problem: "", tier: "Q1", beginner: true, effortHours: 4, capacity: 1, mentorId: "", backupContact: "",
    compensation: "", compensationDetails: "", applyDeadline: deadline, deliverables: [], milestones: [], resources: "", terms: "",
    skillIds: [], prerequisites: [], rubric: [], discipline: "", mentorHours: 3, selectionMethod: "first_come", selectionDetails: "",
    expenses: "None expected", paymentProcess: "", software: "", startingKnowledge: "", portfolioRules: "", confidentialNotes: "" };
  const templates: Record<string, Brief> = {
    analysis: briefSchema.parse({ ...base, title: "Analyse a small operational dataset", summary: "Find a useful pattern in a bounded dataset and explain what the organization should do next.",
      problem: "We have a defined operational question and a small dataset, but need a clear analysis and recommendation.",
      deliverables: ["Reproducible analysis", "One-page findings summary"], milestones: [{ title: "Question and data check", dueInDays: 3 }, { title: "Draft findings", dueInDays: 7 }],
      resources: "A de-identified dataset, data dictionary and named contact for questions.", terms: "Use the data only for this project. Publish only the approved summary.",
      rubric: [{ id: "c1", name: "Sound analysis", description: "The method fits the question and the work can be reproduced.", critical: true, threshold: 3 }] }),
    research: briefSchema.parse({ ...base, title: "Research a bounded industry question", summary: "Compare a small set of credible sources and turn the evidence into a practical recommendation.",
      problem: "We need a focused evidence review before choosing a course of action.", deliverables: ["Source table", "Recommendation memo"],
      milestones: [{ title: "Agree search question", dueInDays: 2 }, { title: "Review evidence", dueInDays: 7 }],
      resources: "Background note, key terms and access to a company contact.", terms: "Cite sources and do not include confidential details in the public summary.",
      rubric: [{ id: "c1", name: "Evidence and reasoning", description: "Sources are credible, compared fairly and support the recommendation.", critical: true, threshold: 3 }] }),
  };
  const rubricRows = await db.select().from(rubricTemplates).where(eq(rubricTemplates.active, true)).orderBy(desc(rubricTemplates.version));
  const latestRubrics = rubricRows.filter((r, i, all) => all.findIndex((x) => x.name === r.name) === i);
  const rubric = rubricRows.find((r) => r.id === rubricId);
  const selected = templates[kind] ?? (rubric ? briefSchema.parse({ ...base, rubric: rubric.criteria }) : undefined);
  return (
    <Page title="New brief" description="Save a draft any time. Submitting sends it to staff for the quality check."
      back={{ href: "/company", label: "Company projects" }}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="mb-6 flex flex-wrap items-center gap-2 text-sm"><span className="text-muted-foreground">Start with a template:</span>
        <Button asChild size="sm" variant="outline"><Link href={`/company/projects/new?org=${org}&template=analysis`}>Data analysis</Link></Button>
        <Button asChild size="sm" variant="outline"><Link href={`/company/projects/new?org=${org}&template=research`}>Research brief</Link></Button>
        {latestRubrics.map((r) => <Button asChild size="sm" variant="outline" key={r.id}><Link href={`/company/projects/new?org=${org}&rubric=${r.id}`}>{r.name} rubric</Link></Button>)}
        {(kind || rubricId) && <Button asChild size="sm" variant="ghost"><Link href={`/company/projects/new?org=${org}`}>Clear template</Link></Button>}
      </div>
      <BriefForm orgId={org} b={selected} {...await formOptions(db, org)} />
    </Page>
  );
}
