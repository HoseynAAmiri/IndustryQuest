import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Briefcase, ClipboardCheck, GraduationCap, ShieldCheck, Users } from "lucide-react";
import { Button, Page } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

const STEPS = [
  { icon: Briefcase, title: "Pick a real project", text: "Small, scoped briefs from companies, with the effort, mentor and rubric shown up front." },
  { icon: Users, title: "Work with a named mentor", text: "Checkpoints, questions and one revision round are part of every project." },
  { icon: BadgeCheck, title: "Earn verified evidence", text: "Accepted work becomes a record anyone can check, and it opens harder projects." },
];

export default async function Home() {
  const session = await getSession();
  if (!session)
    return (
      <main id="main" className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
        <p className="mb-3 text-sm font-medium text-primary">Real projects. Real mentors. Proven skills.</p>
        <h1 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl">
          Go from “I studied this” to “here’s the work I did, and who reviewed it.”
        </h1>
        <p className="mt-4 max-w-xl text-lg text-muted-foreground">
          No prior industry experience needed. Start with a beginner project and work up from there.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild size="lg"><Link href="/explore">Browse projects <ArrowRight /></Link></Button>
          <Button asChild size="lg" variant="outline"><Link href="/sign-up">Create an account</Link></Button>
        </div>
        <div className="mt-16 grid gap-4 sm:grid-cols-3">
          {STEPS.map((s) => (
            <Card key={s.title}>
              <CardHeader>
                <s.icon className="mb-2 size-6 text-primary" aria-hidden />
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </main>
    );

  const roles = await getRoles(getDb(), session.user.id);
  if (!roles.isStudent && !roles.isStaff && !roles.ownerOf.length && !roles.mentorOf.length) redirect("/onboarding");
  const tiles = [
    roles.isStudent && { href: "/quests", icon: GraduationCap, title: "Your quests", text: "Applications, active work and your next milestone." },
    roles.isStudent && { href: "/explore", icon: Briefcase, title: "Find a project", text: "Projects that fit your skills and weekly time." },
    roles.ownerOf.length > 0 && { href: "/company", icon: Briefcase, title: "Company projects", text: "Drafts, applicants and results." },
    roles.mentorOf.length > 0 && { href: "/mentor", icon: ClipboardCheck, title: "Mentor queue", text: "Reviews and questions waiting for you." },
    roles.isStaff && { href: "/staff", icon: ShieldCheck, title: "Staff queue", text: "Organizations and briefs to approve." },
  ].filter((t) => !!t);
  return (
    <Page title={`Welcome back, ${session.user.name.split(" ")[0]}`} description="Where you left off.">
      <div className="grid gap-4 sm:grid-cols-2">
        {tiles.map((t) => (
          <Link key={t.href} href={t.href} className="group rounded-xl focus-visible:outline-2 focus-visible:outline-ring">
            <Card className="h-full transition-colors group-hover:border-primary/50">
              <CardHeader>
                <t.icon className="mb-2 size-6 text-primary" aria-hidden />
                <CardTitle className="flex items-center gap-1">{t.title} <ArrowRight className="size-4 opacity-0 transition-opacity group-hover:opacity-100" /></CardTitle>
                <CardDescription>{t.text}</CardDescription>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </Page>
  );
}
