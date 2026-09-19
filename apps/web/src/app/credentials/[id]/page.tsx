import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { BadgeCheck, CircleAlert, ShieldCheck } from "lucide-react";
import { Alert, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth";
import { publicCredential } from "@/server/credentials";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Credential verification", robots: { index: false } };

const STATUS = {
  active: ["Valid", "The record is current and matches what was issued."],
  revoked: ["Revoked", "This record was withdrawn after a documented review."],
  superseded: ["Superseded", "A newer record replaces this one."],
} as const;

// CRD-02, AC-14: validates the record without files, scores, feedback or confidential company detail.
export default async function Verify({ params }: PageProps<"/credentials/[id]">) {
  const session = await getSession();
  const c = await publicCredential(getDb(), (await params).id, session?.user ?? null);
  if (!c) notFound();
  const [label, meaning] = STATUS[c.c.status];
  return (
    <div className="mx-auto grid max-w-2xl gap-6 px-4 py-10">
      {!c.c.isPublic && <Alert tone="info">Preview. Only you can see this page until you share it from your profile.</Alert>}
      <Card>
        <CardHeader className="gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4" /> IndustryQuest verification</div>
          <CardTitle className="text-2xl">{c.c.title}</CardTitle>
          <CardDescription>Issued to <span className="font-medium text-foreground">{c.holder}</span> on {when(c.c.issuedAt)}</CardDescription>
          <div>
            {c.c.status === "active"
              ? <Badge className="gap-1"><BadgeCheck className="size-3" /> {label}</Badge>
              : <Badge variant="destructive" className="gap-1"><CircleAlert className="size-3" /> {label}</Badge>}
            <span className="ml-2 text-sm text-muted-foreground">{meaning}</span>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 border-t pt-5 text-sm">
          <p>{c.c.summary}</p>
          {c.c.summaryStatus === "approved" && c.c.proposedSummary && (
            <div><p className="text-muted-foreground">Contribution, in the student's words (approved by the company)</p><p>{c.c.proposedSummary}</p></div>
          )}
          <dl className="grid gap-3 sm:grid-cols-2">
            {c.project && <div><dt className="text-muted-foreground">Project</dt><dd className="font-medium">{c.project} ({c.tier})</dd></div>}
            {c.org && <div><dt className="text-muted-foreground">Company</dt><dd className="font-medium">{c.org}</dd></div>}
            {c.mentor && <div><dt className="text-muted-foreground">Reviewed by</dt><dd className="font-medium">{c.mentor}, assigned mentor</dd></div>}
            <div><dt className="text-muted-foreground">Issuer</dt><dd className="font-medium">IndustryQuest</dd></div>
          </dl>
          <div className="rounded-lg bg-muted/50 p-3 text-muted-foreground">
            {c.c.kind === "skill_tier"
              ? "Skill tiers need rubric scores of 3 or 4 on criteria mapped to the skill. Emerging: one accepted project. Bronze: two projects with two different reviewers."
              : c.c.kind === "achievement"
                ? "An achievement marks a milestone. On its own it doesn't certify a technical skill."
                : "The work was assessed against a rubric published before the student applied. Files and private feedback stay with the student and the company."}
          </div>
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">Screenshots aren't proof. This page is the live record, and it changes if the credential is corrected or revoked.</p>
    </div>
  );
}
