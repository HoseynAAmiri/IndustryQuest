import Link from "next/link";
import { Bookmark, BookmarkCheck, CircleCheck, Clock, Lock, Sparkles, Users } from "lucide-react";
import { checkEligibility, type Brief, type Tier } from "@iq/core";
import { toggleSave } from "@/app/explore/actions";
import { COMP } from "@/components/brief-view";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

export type CardData = {
  id: string; state: string; b: Brief; org: string; mentor: string | null; openPlaces: number; saved: boolean;
  fit: { eligible: boolean; reasons: string[] } | null;
};

const TIER_NAME = { emerging: "Emerging", bronze: "Bronze" } as const;

// Status in words, never colour alone (EXP-03). Order matters: closed/paused beat "full".
export function availability(state: string, openPlaces: number, capacity: number) {
  if (state === "closed") return { label: "Closed", tone: "outline" as const };
  if (state === "paused") return { label: "Paused, not taking applications", tone: "secondary" as const };
  if (openPlaces === 0) return { label: "Full", tone: "secondary" as const };
  return { label: `${openPlaces} of ${capacity} ${capacity === 1 ? "place" : "places"} open`, tone: "default" as const };
}

export function ProjectCard({ c, names, tiers, back }: { c: CardData; names: Record<string, string>; tiers: Record<string, Tier>; back: string }) {
  const avail = availability(c.state, c.openPlaces, c.b.capacity);
  const missing = c.fit ? checkEligibility(c.b.prerequisites, tiers).missing : [];
  return (
    <Card className="flex flex-col transition-colors hover:border-primary/40">
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span className="truncate">{c.org}</span>
          <Badge variant="outline">{c.b.tier === "Q1" ? "Q1 Starter" : "Q2 Foundation"}</Badge>
        </CardDescription>
        <CardTitle className="text-base leading-snug">
          <Link href={`/projects/${c.id}`} className="after:absolute after:inset-0 hover:underline focus-visible:outline-none">{c.b.title}</Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="relative grid flex-1 content-start gap-3 text-sm">
        <p className="line-clamp-2 text-muted-foreground">{c.b.summary}</p>
        <div className="flex flex-wrap gap-1.5">
          {c.b.beginner && <Badge variant="secondary">Beginner friendly</Badge>}
          <Badge variant="secondary">{COMP[c.b.compensation]}</Badge>
          <Badge variant="secondary" className="gap-1"><Clock className="size-3" />{c.b.effortHours} h</Badge>
          {c.b.skillIds.slice(0, 3).map((s) => <Badge key={s} variant="outline">{names[s] ?? s}</Badge>)}
        </div>
        {c.fit && missing.length > 0 && (
          <p className="flex items-start gap-1.5 text-amber-700 dark:text-amber-400">
            <Lock className="mt-0.5 size-3.5 shrink-0" />
            Needs {missing.map((m) => `${TIER_NAME[m.minTier]} in ${names[m.skillId] ?? m.skillId}`).join(" and ")}
          </p>
        )}
        {c.fit && missing.length === 0 && c.fit.reasons.length > 0 && (
          <ul className="grid gap-1 text-muted-foreground">
            {c.fit.reasons.slice(0, 2).map((r) => <li key={r} className="flex items-start gap-1.5"><Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" />{r}</li>)}
          </ul>
        )}
      </CardContent>
      <CardFooter className="relative flex items-center justify-between gap-2 border-t pt-4 text-sm">
        <span className="flex items-center gap-1.5">
          {avail.tone === "default" ? <CircleCheck className="size-4 text-green-600" /> : <Users className="size-4 text-muted-foreground" />}
          {avail.label}
        </span>
        {c.fit && (
          <form action={toggleSave}>
            <input type="hidden" name="projectId" value={c.id} />
            <input type="hidden" name="back" value={back} />
            <Button variant="ghost" size="icon-sm" aria-label={c.saved ? `Unsave ${c.b.title}` : `Save ${c.b.title}`} aria-pressed={c.saved}>
              {c.saved ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
            </Button>
          </form>
        )}
      </CardFooter>
    </Card>
  );
}
