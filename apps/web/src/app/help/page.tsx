import type { Metadata } from "next";
import { Page } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Help" };

const topics = [
  ["Getting started", "Choose your role, finish only the required profile fields, then use Explore or your role dashboard. Draft onboarding work is saved in your account."],
  ["Project expectations", "The accepted brief fixes the scope, effort, milestones, mentor support and terms. A later material change needs the student's agreement."],
  ["Assessment", "Mentors score the rubric attached to the accepted brief. A revision keeps earlier submissions and feedback. Students may appeal a final decision privately."],
  ["Sharing and privacy", "Profiles are private by default. Credential links show only the approved summary, issuer and status. Project files, reflections, applications and private feedback are never public."],
  ["Account access", "Use Forgot password if you cannot sign in. Confirm a new personal email before losing a university address. Staff and organization owners must use email two-factor authentication outside the demo."],
  ["Retention and deletion", "Accepted briefs, assessments, credentials and audit records stay as evidence. Export your record first if you wish, then request account deletion from Support. Staff revoke login and remove personal profile details while keeping an anonymized project record."],
] as const;

export default function Help() {
  return <Page title="Help" description="How the pilot works and what happens to your data.">
    <div className="grid gap-4 md:grid-cols-2">{topics.map(([title, text]) => <Card key={title}>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">{text}</CardContent>
    </Card>)}</div>
  </Page>;
}
