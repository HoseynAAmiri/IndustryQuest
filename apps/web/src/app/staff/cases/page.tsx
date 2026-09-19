import type { Metadata } from "next";
import Link from "next/link";
import { asc, desc, eq, sql } from "drizzle-orm";
import { ChevronRight } from "lucide-react";
import { cases, user } from "@iq/db";
import { CaseStatus } from "@/components/case-list";
import { Alert, Page, when } from "@/components/ui";
import { Card } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { CASE_TYPES } from "@/server/cases";
import { getDb } from "@/server/db";

export const metadata: Metadata = { title: "Cases" };

export default async function Cases() {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Cases"><Alert>Staff only.</Alert></Page>;
  const rows = await db.select({ c: cases, reporter: user.name }).from(cases).innerJoin(user, eq(user.id, cases.reporterId))
    .orderBy(sql`${cases.status} = 'resolved'`, asc(cases.dueAt), desc(cases.createdAt));
  const owners = Object.fromEntries((await db.select({ id: user.id, name: user.name }).from(user).where(eq(user.isStaff, true))).map((u) => [u.id, u.name]));
  return (
    <Page title="Cases" description="Blockers, extension requests, reports, support and appeals. Oldest reply-by date first.">
      <Card className="py-0">
        <ul className="divide-y">
          {rows.map(({ c, reporter }) => {
            const late = c.status !== "resolved" && c.dueAt < new Date();
            return (
              <li key={c.id}>
                <Link href={`/staff/cases/${c.id}`} className="press flex flex-wrap items-center gap-3 p-4 hover:bg-muted/50">
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">#{c.number} · {CASE_TYPES[c.type]}</span>
                    <span className="block truncate text-sm text-muted-foreground">{reporter} · {c.summary}</span>
                  </span>
                  <span className={`text-sm ${late ? "font-medium text-destructive" : "text-muted-foreground"}`}>
                    {c.status === "resolved" ? `Resolved ${when(c.resolvedAt)}` : `${late ? "Overdue since" : "Reply by"} ${when(c.dueAt)}`}
                  </span>
                  <span className="text-sm text-muted-foreground">{c.ownerId ? owners[c.ownerId] : "Unassigned"}</span>
                  <CaseStatus s={c.status} />
                  <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
                </Link>
              </li>
            );
          })}
          {!rows.length && <li className="p-10 text-center text-muted-foreground">No cases.</li>}
        </ul>
      </Card>
    </Page>
  );
}
