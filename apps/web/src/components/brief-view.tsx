import type { ReactNode } from "react";
import { Building2, CalendarClock, Clock, Coins, GraduationCap, UserRound } from "lucide-react";
import { SELECTION, briefSchema, type Brief } from "@iq/core";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const COMP = { paid: "Paid", stipend: "Stipend", unpaid: "Unpaid", course: "Course-associated", "": "Not stated" } as const;
const TIER = (b: Brief) => (b.tier === "Q1" ? "Q1 Starter" : "Q2 Foundation");

// Everything a student needs to judge a project before applying (PRD §4.1 step 3, §9.1).
// restricted: hide material the company shares only with enrolled students (PRJ-09).
export function BriefView({ b, mentorName, orgName, skillNames, restricted = false }: {
  b: Brief; mentorName?: string | null; orgName: string; skillNames: Record<string, string>; restricted?: boolean;
}) {
  b = briefSchema.parse(b); // fills fields added after older briefs were saved
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
          <dl className="mt-5 grid gap-x-6 gap-y-3 border-t pt-4 text-sm sm:grid-cols-2">
            {b.discipline && <Row label="Discipline">{b.discipline}</Row>}
            {b.selectionMethod && <Row label="How applicants are chosen">{SELECTION[b.selectionMethod]}{b.selectionDetails && `. ${b.selectionDetails}`}</Row>}
            {b.mentorHours > 0 && <Row label="Mentor time">About {b.mentorHours} hours with you, replies within two business days</Row>}
            {b.expenses && <Row label="Expenses">{b.expenses}</Row>}
            {b.paymentProcess && <Row label="Payment">{b.paymentProcess}</Row>}
            {b.startingKnowledge && <Row label="Helpful to know already">{b.startingKnowledge}</Row>}
            {b.software && <Row label="Software and equipment">{b.software}</Row>}
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
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-semibold text-accent-foreground">{i + 1}</span>
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
        {b.resources && (
          <Section title="Resources">
            {restricted
              ? <p className="text-muted-foreground">Data and starter material are shared once you're enrolled.</p>
              : <p className="whitespace-pre-line">{b.resources}</p>}
          </Section>
        )}
        <Section title="Terms">
          <p className="whitespace-pre-line">{b.terms}</p>
          {b.portfolioRules && <p className="mt-3 text-sm"><span className="font-medium">Portfolio: </span>{b.portfolioRules}</p>}
        </Section>
        {!restricted && b.confidentialNotes && (
          <Section title="Confidential details"><p className="whitespace-pre-line">{b.confidentialNotes}</p><p className="mt-2 text-xs text-muted-foreground">Visible to enrolled students only.</p></Section>
        )}
      </div>
      <p className="text-sm text-muted-foreground">Backup contact if your mentor is unavailable: {b.backupContact}</p>
    </div>
  );
}

// dl > div > (dt, dd) only, so the icon lives inside the dt.
function Fact({ icon: Icon, label, children }: { icon: typeof Clock; label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="flex items-center gap-2 text-sm text-muted-foreground"><Icon className="size-4 shrink-0" aria-hidden />{label}</dt>
      <dd className="pl-6 font-medium">{children}</dd>
    </div>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return <div><dt className="text-muted-foreground">{label}</dt><dd>{children}</dd></div>;
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader><CardTitle>{title}</CardTitle></CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
