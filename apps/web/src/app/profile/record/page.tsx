import type { Metadata } from "next";
import { Button, Page, when } from "@/components/ui";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { exportRecord } from "@/server/profile";

export const metadata: Metadata = { title: "Your record" };

// PRO-12, CRD-05: a human-readable copy; print it or save it as PDF from the browser.
export default async function Record() {
  const me = await requireUser();
  const r = await exportRecord(getDb(), me.id);
  return (
    <Page title="Your record" description={`${r.person.name} · exported ${when(new Date(r.exportedAt), "UTC", true)}`} back={{ href: "/profile?tab=details", label: "Profile" }}
      actions={<Button asChild variant="outline" size="sm"><a href="/api/export">Download JSON</a></Button>}>
      <div className="grid gap-6">
        <Card>
          <CardHeader><CardTitle>Projects</CardTitle></CardHeader>
          <CardContent className="grid gap-5">
            {r.projects.map((p, i) => (
              <section key={i} className="grid gap-1 border-b pb-4 last:border-0 last:pb-0">
                <h3 className="font-medium">{p.title} <span className="font-normal text-muted-foreground">· {p.company} · {p.status.replaceAll("_", " ")}</span></h3>
                <p className="text-sm text-muted-foreground">Brief version {p.briefVersion}{p.completedAt && ` · completed ${when(p.completedAt)}`}</p>
                {p.submissions.map((s) => (
                  <div key={s.version} className="mt-2 rounded-md bg-muted/40 p-3 text-sm">
                    <p><span className="font-medium">Version {s.version}:</span> {s.contribution}</p>
                    <p className="text-muted-foreground">Review: {s.review.decision.replace("_", " ")}. {s.review.comment}</p>
                  </div>
                ))}
              </section>
            ))}
            {!r.projects.length && <p className="text-muted-foreground">No projects yet.</p>}
          </CardContent>
        </Card>
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Credentials</CardTitle></CardHeader>
            <CardContent><ul className="grid gap-1 text-sm">{r.credentials.map((c) => <li key={c.id}>{c.title} · {c.status} · {when(c.issuedAt)}</li>)}</ul></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Skills</CardTitle></CardHeader>
            <CardContent className="grid gap-1 text-sm">
              {r.skillEvidence.map((e, i) => <p key={i}>{e.skill}: scored {e.score}/4{e.revoked && " (revoked)"} · verified</p>)}
              {r.selfReportedSkills.map((e, i) => <p key={`s${i}`}>{e.skill}: {e.level} · self-reported</p>)}
              {r.equivalencies.map((e, i) => <p key={`q${i}`}>{e.skill}: equivalency accepted, not a platform credential</p>)}
            </CardContent>
          </Card>
        </div>
        <p className="text-xs text-muted-foreground">Company files aren't included: they stay under the company's terms. Credentials stay verifiable at their links.</p>
      </div>
    </Page>
  );
}
