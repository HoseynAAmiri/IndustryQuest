import { Alert, Page, messages } from "@/components/ui";
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
  return (
    <Page title="New brief" description="Save a draft any time. Submitting sends it to staff for the quality check."
      back={{ href: "/company", label: "Company projects" }}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <BriefForm orgId={org} {...await formOptions(db, org)} />
    </Page>
  );
}
