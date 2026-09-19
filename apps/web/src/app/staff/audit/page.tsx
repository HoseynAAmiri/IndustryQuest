import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { auditEvents, user } from "@iq/db";
import { Alert, Page, when } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Audit log" };

// OPS-07: consequential and sensitive actions with who, what, when and why.
export default async function Audit() {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Audit log"><Alert>Staff only.</Alert></Page>;
  const rows = await db.select({ a: auditEvents, actor: user.name }).from(auditEvents).leftJoin(user, eq(user.id, auditEvents.actorId))
    .orderBy(desc(auditEvents.createdAt)).limit(200);
  return (
    <Page title="Audit log" description="Assessments, credentials, briefs, verification, cases and staff access. Latest 200.">
      <Card className="py-0">
        <Table>
          <TableHeader><TableRow><TableHead>When (UTC)</TableHead><TableHead>Who</TableHead><TableHead>Action</TableHead><TableHead>Target</TableHead><TableHead>Reason</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map(({ a, actor }) => (
              <TableRow key={a.id} className="align-top">
                <TableCell className="whitespace-nowrap">{when(a.createdAt, "UTC", true)}</TableCell>
                <TableCell>{actor ?? "System"}</TableCell>
                <TableCell>{a.action.replaceAll("_", " ")}</TableCell>
                <TableCell className="font-mono text-xs">{a.targetType} {a.targetId.slice(0, 8)}</TableCell>
                <TableCell className="max-w-80 whitespace-normal text-muted-foreground">{a.reason}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </Page>
  );
}
