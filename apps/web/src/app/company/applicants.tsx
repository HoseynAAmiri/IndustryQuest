import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { ArrowRight, Users } from "lucide-react";
import { enrollments, skillClaims, skills, user, type Db } from "@iq/db";
import { Badge } from "@/components/ui/badge";
import { studentTiers } from "@/server/discovery";
import { CLAIM_LEVELS } from "@/server/profile";
import { Button, EnrollmentBadge, when } from "@/components/ui";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { expireStaleOffers } from "@/server/enrollments";
import { offerAction, rejectAction } from "./actions";

// ENR-03: owners review applicants against the declared criteria. They see the application only,
// never private reflections or academic records.
export async function Applicants({ db, projectId, capacity, openPlaces }: { db: Db; projectId: string; capacity: number; openPlaces: number }) {
  await expireStaleOffers(db);
  const rows = await db.select({ e: enrollments, name: user.name }).from(enrollments)
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(eq(enrollments.projectId, projectId)).orderBy(asc(enrollments.createdAt));
  const waiting = rows.filter((r) => r.e.state === "applied");
  const names = Object.fromEntries((await db.select().from(skills)).map((k) => [k.id, k.name]));
  const skillsOf = Object.fromEntries(await Promise.all(waiting.map(async ({ e }) => [e.studentId, {
    verified: Object.entries(await studentTiers(db, e.studentId)).filter(([, t]) => t !== "none"),
    claimed: await db.select().from(skillClaims).where(eq(skillClaims.userId, e.studentId)),
  }] as const)));
  const people = rows.filter((r) => ["offered", "active", "submitted", "revision_requested", "completed"].includes(r.e.state));
  const past = rows.filter((r) => ["declined", "withdrawn", "offer_declined", "offer_expired", "closed_incomplete"].includes(r.e.state));
  return (
    <div id="applicants" className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="size-5" /> Applicants ({waiting.length})</CardTitle>
          <CardDescription>{openPlaces} of {capacity} places open. An offer holds a place for 5 days.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {waiting.map(({ e, name }) => (
            <div key={e.id} className="grid gap-3 rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium">{name}</span>
                <span className="text-sm text-muted-foreground">Applied {when(e.createdAt)}</span>
              </div>
              <p className="text-sm">{e.motivation}</p>
              {e.availability && <p className="text-sm text-muted-foreground">Availability: {e.availability}</p>}
              <div className="flex flex-wrap gap-1.5">
                {skillsOf[e.studentId].verified.map(([id, t]) => <Badge key={id}>{names[id]}: {t === "bronze" ? "Bronze" : "Emerging"} (verified)</Badge>)}
                {skillsOf[e.studentId].claimed.map((c) => <Badge key={c.skillId} variant="outline">{names[c.skillId]} · {CLAIM_LEVELS[c.level].toLowerCase()} (self-reported)</Badge>)}
                {!skillsOf[e.studentId].verified.length && !skillsOf[e.studentId].claimed.length && <span className="text-sm text-muted-foreground">No skills listed yet. Beginners are welcome on this brief if it says so.</span>}
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <form action={offerAction}>
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="enrollmentId" value={e.id} />
                  <Button size="sm" disabled={!openPlaces}>Make an offer</Button>
                </form>
                <form action={rejectAction} className="flex flex-1 gap-2">
                  <input type="hidden" name="projectId" value={projectId} />
                  <input type="hidden" name="enrollmentId" value={e.id} />
                  <Input name="note" aria-label={`Reason for ${name}`} placeholder="Constructive reason (optional)" className="h-8 min-w-40 flex-1" />
                  <Button size="sm" variant="outline">Decline</Button>
                </form>
              </div>
            </div>
          ))}
          {!waiting.length && <p className="text-sm text-muted-foreground">No applications waiting.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Participants and offers</CardTitle>
          <CardDescription>Everyone holding or using a place.</CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y rounded-lg border">
            {people.map(({ e, name }) => (
              <li key={e.id} className="flex flex-wrap items-center gap-3 p-3 text-sm">
                <span className="flex-1 font-medium">{name}</span>
                {e.state === "offered" && <span className="text-muted-foreground">Expires {when(e.offerExpiresAt, "UTC", true)}</span>}
                <EnrollmentBadge state={e.state} />
                {e.state !== "offered" && (
                  <Button asChild size="sm" variant="ghost"><Link href={`/workspace/${e.id}`}>Workspace <ArrowRight /></Link></Button>
                )}
              </li>
            ))}
            {!people.length && <li className="p-4 text-sm text-muted-foreground">No one yet.</li>}
          </ul>
          {past.length > 0 && <p className="mt-3 text-sm text-muted-foreground">{past.length} closed ({past.map((p) => p.name).join(", ")}): declined, withdrawn or expired.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
