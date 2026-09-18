import type { ReactNode } from "react";
import { Building2, CalendarClock, Clock, Coins, GraduationCap, UserRound } from "lucide-react";
import type { Brief } from "@iq/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const COMP = { paid: "Paid", stipend: "Stipend", unpaid: "Unpaid", course: "Course-associated", "": "Not stated" } as const;
const TIER = (b: Brief) => (b.tier === "Q1" ? "Q1 Starter" : "Q2 Foundation");

// Everything a student needs to judge a project before applying (PRD §4.1 step 3, §9.1).
export function BriefView({ b, mentorName, orgName, skillNames }: {
  b: Brief; mentorName?: string | null; orgName: string; skillNames: Record<string, string>;
}) {
  const skill = (id?: string) => (id ? skillNames[id] ?? id : null);
  return (
    <div className="grid gap-6">
      <Card>
        <CardContent>
          <dl className="grid gap-5 sm:grid-cols-3">
            <Fact icon={Building2} label="Company">{orgName}</Fact>
            <Fact icon={UserRound} label="Mentor">{mentorName ?? "Not assigned yet"}</Fact>
            <Fact icon={GraduationCap} label="Tier">{TIER(b)}{b.beginner && <Badge variant="secondary" className="ml-2">Beginner friendly</Badge>}</Fact>
            <Fact icon={Clock} label="Effort">About {b.effortHours} hours</Fact>
            <Fact icon={Coins} label="Compensation">{COMP[b.compensation]}{b.compensationDetails && `: ${b.compensationDetails}`}</Fact>
            <Fact icon={CalendarClock} label="Apply by">{b.applyDeadline ? `${b.applyDeadline} (UTC)` : "Not set"}</Fact>
          </dl>
          {b.skillIds.length > 0 && (
            <div className="mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
              <span className="text-sm text-muted-foreground">Builds</span>
              {b.skillIds.map((s) => <Badge key={s} variant="outline">{skill(s)}</Badge>)}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Section title="The problem"><p className="whitespace-pre-line">{b.problem}</p></Section>
        <Section title="What you'll deliver"><ul className="list-disc space-y-1 pl-5">{b.deliverables.map((d) => <li key={d}>{d}</li>)}</ul></Section>
      </div>

      <Section title="Milestones">
        <ol className="grid gap-3">
          {b.milestones.map((m, i) => (
            <li key={m.title} className="flex items-start gap-3">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{i + 1}</span>
              <span>{m.title} <span className="text-muted-foreground">· day {m.dueInDays}</span></span>
            </li>
          ))}
        </ol>
      </Section>

      {b.prerequisites.length > 0 && (
        <Section title="Required skill evidence">
          <ul className="flex flex-wrap gap-2">
            {b.prerequisites.map((p) => (
              <li key={p.skillId}><Badge>{skill(p.skillId)}: {p.minTier === "emerging" ? "Emerging" : "Bronze"} or higher</Badge></li>
            ))}
          </ul>
        </Section>
      )}

      <Section title="How your work is assessed">
        <p className="mb-3 text-sm text-muted-foreground">
          Each criterion is scored 1 to 4. Required criteria must reach their threshold to pass; a high average doesn't make up for a missed one.
          One revision round is included.
        </p>
        <Table>
          <TableHeader>
            <TableRow><TableHead>Criterion</TableHead><TableHead>Required</TableHead><TableHead>Threshold</TableHead><TableHead>Skill evidence</TableHead></TableRow>
          </TableHeader>
          <TableBody>
            {b.rubric.map((c) => (
              <TableRow key={c.id} className="align-top">
                <TableCell className="whitespace-normal"><div className="font-medium">{c.name}</div><div className="text-muted-foreground">{c.description}</div></TableCell>
                <TableCell>{c.critical ? <Badge>Required</Badge> : <Badge variant="outline">Optional</Badge>}</TableCell>
                <TableCell>{c.threshold} of 4</TableCell>
                <TableCell>{skill(c.skillId) ?? <span className="text-muted-foreground">None</span>}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        {b.resources && <Section title="Resources"><p className="whitespace-pre-line">{b.resources}</p></Section>}
        <Section title="Terms"><p className="whitespace-pre-line">{b.terms}</p></Section>
      </div>
      <p className="text-sm text-muted-foreground">Backup contact if your mentor is unavailable: {b.backupContact}</p>
    </div>
  );
}

function Fact({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden />
      <div><dt className="text-sm text-muted-foreground">{label}</dt><dd className="font-medium">{children}</dd></div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
