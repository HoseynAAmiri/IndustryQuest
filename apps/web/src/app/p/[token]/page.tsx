import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { when } from "@/components/ui";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getDb } from "@/server/db";
import { sharedProfile } from "@/server/profile";

export const metadata: Metadata = { title: "Profile", robots: { index: false } };

// PRO-04/05: only what the student chose to share. Private, expired or replaced links show nothing.
export default async function SharedProfile({ params }: PageProps<"/p/[token]">) {
  const p = await sharedProfile(getDb(), (await params).token);
  if (!p) notFound();
  return (
    <div className="mx-auto grid w-full max-w-3xl gap-6 px-4 py-10">
      <Card>
        <CardHeader className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16">{p.image && <AvatarImage src={p.image} alt="" />}<AvatarFallback className="text-lg">{p.name.split(" ").map((x) => x[0]).join("").slice(0, 2)}</AvatarFallback></Avatar>
          <div className="flex-1">
            <CardTitle className="text-2xl">{p.name}</CardTitle>
            <CardDescription>{[p.pronouns, p.discipline].filter(Boolean).join(" · ")}</CardDescription>
            {p.bio && <p className="mt-2 text-sm">{p.bio}</p>}
          </div>
        </CardHeader>
      </Card>
      <Card>
        <CardHeader><CardTitle>Verified skills</CardTitle><CardDescription>From mentor-reviewed project work on IndustryQuest.</CardDescription></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {p.skillTiers.map((t) => <Badge key={t.name} className="gap-1"><BadgeCheck className="size-3" />{t.name}: {t.tier === "bronze" ? "Bronze" : "Emerging"}</Badge>)}
          {!p.skillTiers.length && <p className="text-sm text-muted-foreground">None yet.</p>}
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>Completed projects</CardTitle></CardHeader>
        <CardContent className="grid gap-4">
          {p.completed.map((c) => (
            <div key={c.e.id}>
              <p className="font-medium">{c.title}</p>
              <p className="text-sm text-muted-foreground">{c.org} · {when(c.e.completedAt)}</p>
              {c.summary && <p className="mt-1 text-sm">{c.summary}</p>}
            </div>
          ))}
          {p.creds.length > 0 && (
            <div className="flex flex-wrap gap-2 border-t pt-4">
              {p.creds.map((c) => <Link key={c.id} href={`/credentials/${c.id}`} className="text-sm text-primary underline-offset-4 hover:underline">Verify: {c.title}</Link>)}
            </div>
          )}
        </CardContent>
      </Card>
      <p className="text-center text-xs text-muted-foreground">Shared from IndustryQuest. The student controls this link and can turn it off at any time.</p>
    </div>
  );
}
