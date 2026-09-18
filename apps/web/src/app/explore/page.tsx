import type { Metadata } from "next";
import Link from "next/link";
import { SearchX, SlidersHorizontal } from "lucide-react";
import { Alert, Button, CheckField, Field, NONE, Page, SelectField, messages } from "@/components/ui";
import { ProjectCard } from "@/components/project-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { listProjects, type Filters } from "@/server/discovery";
import { coordinatorEmail } from "@/server/demo";

export const metadata: Metadata = { title: "Explore projects" };

const one = (v: string | string[] | undefined) => (typeof v === "string" && v !== NONE && v !== "" ? v : undefined);

export default async function Explore({ searchParams }: PageProps<"/explore">) {
  const sp = await searchParams;
  const { error, info } = await messages(searchParams);
  const f: Filters = {
    q: one(sp.q), skill: one(sp.skill), tier: one(sp.tier), compensation: one(sp.compensation),
    maxHours: Number(one(sp.maxHours)) || undefined,
    beginner: sp.beginner === "on", openOnly: sp.open === "on", includeInactive: sp.inactive === "on", saved: sp.saved === "on",
  };
  const session = await getSession();
  const { cards, names, tiers, isStudent } = await listProjects(getDb(), session?.user ?? null, f);
  const filtered = Object.values(f).some(Boolean);
  const here = `/explore?${new URLSearchParams(Object.entries(sp).filter(([, v]) => typeof v === "string") as [string, string][])}`;

  return (
    <Page title="Explore projects"
      description={isStudent ? "Sorted by fit: your interests, weekly time and skill evidence. Projects you can't join yet sink to the end."
        : "Real, scoped projects from partner companies. Sign in to see how each one fits you."}>
      <div className="mb-4 grid gap-3"><Alert>{error}</Alert><Alert tone="info">{info}</Alert></div>
      <div className="grid gap-6 lg:grid-cols-[17rem_1fr]">
        <Card className="h-fit lg:sticky lg:top-20">
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><SlidersHorizontal className="size-4" /> Filters</CardTitle></CardHeader>
          <CardContent>
            <form role="search" className="grid gap-4">
              <Field label="Search" name="q" type="search" defaultValue={f.q} placeholder="Title, company, problem" />
              <SelectField label="Skill" name="skill" defaultValue={f.skill ?? NONE}
                options={[{ value: NONE, label: "Any skill" }, ...Object.entries(names).map(([value, label]) => ({ value, label }))]} />
              <SelectField label="Tier" name="tier" defaultValue={f.tier ?? NONE} options={[
                { value: NONE, label: "Any tier" }, { value: "Q1", label: "Q1 Starter" }, { value: "Q2", label: "Q2 Foundation" },
              ]} />
              <SelectField label="Compensation" name="compensation" defaultValue={f.compensation ?? NONE} options={[
                { value: NONE, label: "Any" }, { value: "paid", label: "Paid" }, { value: "stipend", label: "Stipend" },
                { value: "unpaid", label: "Unpaid" }, { value: "course", label: "Course-associated" },
              ]} />
              <SelectField label="Effort" name="maxHours" defaultValue={f.maxHours ?? NONE} options={[
                { value: NONE, label: "Any effort" }, { value: "6", label: "Up to 6 hours" }, { value: "15", label: "Up to 15 hours" },
              ]} />
              <div className="grid gap-2.5">
                <CheckField label="Beginner friendly" name="beginner" defaultChecked={f.beginner} />
                <CheckField label="Has open places" name="open" defaultChecked={f.openOnly} />
                <CheckField label="Include paused and closed" name="inactive" defaultChecked={f.includeInactive} />
                {isStudent && <CheckField label="Saved only" name="saved" defaultChecked={f.saved} />}
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="flex-1">Apply</Button>
                {filtered && <Button asChild variant="outline"><Link href="/explore">Clear</Link></Button>}
              </div>
            </form>
          </CardContent>
        </Card>

        <section aria-labelledby="results">
          <h2 id="results" className="mb-3 text-sm text-muted-foreground" aria-live="polite">
            {cards.length} {cards.length === 1 ? "project" : "projects"}{filtered && " match your filters"}
          </h2>
          {cards.length ? (
            <div className="grid gap-4 md:grid-cols-2">
              {cards.map((c) => <ProjectCard key={c.id} c={c} names={names} tiers={tiers} back={here} />)}
            </div>
          ) : (
            <Card>
              <CardContent className="grid justify-items-center gap-3 py-12 text-center">
                <SearchX className="size-10 text-muted-foreground" aria-hidden />
                <p className="font-medium">No projects match these filters.</p>
                <p className="max-w-sm text-sm text-muted-foreground">
                  Try fewer filters, or include paused and closed projects. If nothing fits your skills yet, program staff can suggest one.
                </p>
                <div className="flex gap-2">
                  <Button asChild variant="outline"><Link href="/explore">Clear filters</Link></Button>
                  <Button asChild variant="ghost"><a href={`mailto:${coordinatorEmail()}?subject=Looking%20for%20a%20project`}>Ask a coordinator</a></Button>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </Page>
  );
}
