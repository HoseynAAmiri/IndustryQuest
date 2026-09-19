import type { Metadata } from "next";
import Link from "next/link";
import { Alert, Page } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { isDemo } from "@/server/demo";
import { pilotReport } from "@/server/reports";

export const metadata: Metadata = { title: "Pilot report" };

export default async function Reports({ searchParams }: PageProps<"/staff/reports">) {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Pilot report"><Alert>Staff only.</Alert></Page>;
  const p = (await searchParams).demo;
  const includeDemo = p === undefined ? isDemo() : p === "1";
  const metrics = await pilotReport(db, includeDemo);
  return (
    <Page title="Pilot report" description="Definitions follow PRD §7. Counts come with their denominators; small numbers can't support big claims."
      actions={<Button asChild variant="outline" size="sm"><Link href={`/staff/reports?demo=${includeDemo ? "0" : "1"}`}>{includeDemo ? "Exclude demo data" : "Include demo data"}</Link></Button>}>
      <div className="mb-6">
        <Alert tone="info">{includeDemo ? "Including demo organizations. Real reports exclude them." : "Demo organizations and revoked credentials are excluded."}</Alert>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {metrics.map((m) => (
          <Card key={m.key}>
            <CardHeader>
              <CardDescription>{m.label}</CardDescription>
              <CardTitle className="text-3xl tabular-nums">
                {m.unit === "count" || !m.d ? m.n : `${Math.round((m.n / m.d) * 100)}%`}
                {m.d > 0 && <span className="ml-2 text-base font-normal text-muted-foreground">{m.n} of {m.d}</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {m.d > 0 && m.unit !== "count" && <Progress value={(m.n / m.d) * 100} aria-label={`${m.n} of ${m.d}`} />}
              <p className="text-muted-foreground">{m.why}</p>
              <details>
                <summary className="cursor-pointer text-primary">Source records ({m.ids.length})</summary>
                <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{m.ids.join(", ") || "none"}</p>
              </details>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}
