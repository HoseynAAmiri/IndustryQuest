import type { Metadata } from "next";
import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { briefVersions, enrollments, equivalencies, studentProfiles, user } from "@iq/db";
import { Alert, EnrollmentBadge, Page } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { studentTiers } from "@/server/discovery";

export const metadata: Metadata = { title: "Students" };

const LIVE = ["applied", "offered", "active", "submitted", "revision_requested"];

// EDU-01: roster and placements in one view for the pilot coordinator.
export default async function Students() {
  const me = await requireUser();
  const db = getDb();
  if (!(await getRoles(db, me.id)).isStaff) return <Page title="Students"><Alert>Staff only.</Alert></Page>;
  const people = await db.select({ u: user, p: studentProfiles }).from(studentProfiles).innerJoin(user, eq(user.id, studentProfiles.userId)).orderBy(asc(user.name));
  const all = await db.select({ e: enrollments, title: briefVersions.title }).from(enrollments).innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId));
  const eqs = await db.select().from(equivalencies);
  const rows = await Promise.all(people.map(async ({ u, p }) => ({
    u, p, mine: all.filter((x) => x.e.studentId === u.id),
    verified: Object.values(await studentTiers(db, u.id)).filter((t) => t !== "none").length,
    eq: eqs.filter((q) => q.userId === u.id).length,
  })));
  const placed = rows.filter((r) => r.mine.some((m) => ["active", "submitted", "revision_requested"].includes(m.e.state))).length;
  return (
    <Page title="Students" description={`${rows.length} students · ${placed} placed on a project now · ${rows.filter((r) => !r.mine.length).length} not yet applied anywhere`}>
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow><TableHead>Student</TableHead><TableHead>Current</TableHead><TableHead>Completed</TableHead><TableHead>Verified skills</TableHead><TableHead>Limit</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const live = r.mine.filter((m) => LIVE.includes(m.e.state));
              return (
                <TableRow key={r.u.id} className="align-top">
                  <TableCell>
                    <Link href={`/staff/students/${r.u.id}`} className="font-medium text-primary underline-offset-4 hover:underline">{r.u.name}</Link>
                    <div className="text-xs text-muted-foreground">{r.p.discipline || "No discipline set"} · {r.p.weeklyHours} h/week</div>
                  </TableCell>
                  <TableCell className="whitespace-normal">
                    <div className="grid gap-1">
                      {live.map((m) => <span key={m.e.id} className="flex flex-wrap items-center gap-1.5 text-sm">{m.title} <EnrollmentBadge state={m.e.state} /></span>)}
                      {!live.length && <span className="text-sm text-muted-foreground">Nothing in progress</span>}
                    </div>
                  </TableCell>
                  <TableCell>{r.mine.filter((m) => m.e.state === "completed").length}</TableCell>
                  <TableCell>{r.verified}{r.eq > 0 && <Badge variant="outline" className="ml-2">+{r.eq} equivalency</Badge>}</TableCell>
                  <TableCell>{2 + r.p.extraActiveSlots}{r.p.extraActiveSlots > 0 && <Badge variant="secondary" className="ml-2">exception</Badge>}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </Page>
  );
}
