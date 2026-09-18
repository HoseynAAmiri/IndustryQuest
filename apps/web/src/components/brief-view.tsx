import type { Brief } from "@iq/core";

const COMP = { paid: "Paid", stipend: "Stipend", unpaid: "Unpaid", course: "Course-associated", "": "Not stated" } as const;

// Everything a student needs to judge a project before applying (PRD §4.1 step 3, §9.1).
export function BriefView({ b, mentorName, orgName, skillNames }: {
  b: Brief; mentorName?: string | null; orgName: string; skillNames: Record<string, string>;
}) {
  const skill = (id?: string) => (id ? skillNames[id] ?? id : null);
  return (
    <div className="space-y-6">
      <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-3">
        <Fact label="Company">{orgName}</Fact>
        <Fact label="Mentor">{mentorName ?? "Not assigned yet"}</Fact>
        <Fact label="Tier">{b.tier === "Q1" ? "Q1 Starter" : "Q2 Foundation"}{b.beginner && ", open to beginners"}</Fact>
        <Fact label="Effort">About {b.effortHours} hours</Fact>
        <Fact label="Compensation">{COMP[b.compensation]}{b.compensationDetails && `: ${b.compensationDetails}`}</Fact>
        <Fact label="Apply by">{b.applyDeadline ? `${b.applyDeadline} (UTC)` : "Not set"}</Fact>
      </dl>
      <Section title="The problem"><p className="whitespace-pre-line">{b.problem}</p></Section>
      <Section title="What you'll deliver"><ul className="list-disc pl-6">{b.deliverables.map((d) => <li key={d}>{d}</li>)}</ul></Section>
      <Section title="Milestones">
        <ol className="list-decimal pl-6">{b.milestones.map((m) => <li key={m.title}>{m.title}, due {m.dueInDays} days after you start</li>)}</ol>
      </Section>
      {b.prerequisites.length > 0 && (
        <Section title="Required skill evidence">
          <ul className="list-disc pl-6">{b.prerequisites.map((p) => <li key={p.skillId}>{skill(p.skillId)}: {p.minTier === "emerging" ? "Emerging" : "Bronze"} or higher</li>)}</ul>
        </Section>
      )}
      <Section title="How your work is assessed">
        <p className="mb-2 text-sm text-slate-600">
          Each criterion is scored 1 to 4. Required criteria must reach their threshold to pass; a high average doesn't make up for a missed one.
          One revision round is included.
        </p>
        <table className="w-full text-left text-sm">
          <thead><tr className="border-b"><th className="py-1">Criterion</th><th>Required</th><th>Threshold</th><th>Skill evidence</th></tr></thead>
          <tbody>
            {b.rubric.map((c) => (
              <tr key={c.id} className="border-b align-top">
                <td className="py-1 pr-2"><span className="font-medium">{c.name}</span><br />{c.description}</td>
                <td>{c.critical ? "Yes" : "No"}</td><td>{c.threshold} of 4</td><td>{skill(c.skillId) ?? "None"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>
      {b.resources && <Section title="Resources"><p className="whitespace-pre-line">{b.resources}</p></Section>}
      <Section title="Terms"><p className="whitespace-pre-line">{b.terms}</p></Section>
      <p className="text-sm text-slate-600">Backup contact if your mentor is unavailable: {b.backupContact}</p>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><dt className="text-sm text-slate-600">{label}</dt><dd className="font-medium">{children}</dd></div>;
}
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return <section><h2 className="mb-1 text-lg font-semibold">{title}</h2>{children}</section>;
}
