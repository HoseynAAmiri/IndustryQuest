import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Briefcase, Users } from "lucide-react";
import { Button, Page } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorDashboard, OwnerDashboard, StaffDashboard, StudentDashboard } from "./dashboard";
import { InteractiveHero } from "./interactive-hero";
import { Quotes } from "./quotes";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

const STEPS = [
  { icon: Briefcase, title: "Pick a real project", text: "Small, scoped briefs from companies, with the effort, mentor and rubric shown up front." },
  { icon: Users, title: "Work with a named mentor", text: "Checkpoints, questions and one revision round are part of every project." },
  { icon: BadgeCheck, title: "Earn verified evidence", text: "Accepted work becomes a record anyone can check, and it opens harder projects." },
];

const UNIVERSITIES = [
  "Riverside Technical University", "Northbridge Polytechnic", "Helmsley School of Engineering",
  "Ostara Institute", "Calder University", "Westmere College", "Lumen Applied Science", "Iona School of Mines",
];
const COMPANIES = [
  "Northwind Pumps", "Kestrel Analytics", "Harbor Robotics", "Alder Grid",
  "Solace Materials", "Pine & Watt", "Copperline Logistics", "Quarry & Co",
];

const QUOTES = [
  { initials: "AO", name: "Ada Okafor", role: "Mechanical engineering student", stars: 5,
    text: "The brief said exactly how many hours and what done looked like. First time a project didn't balloon on me." },
  { initials: "MS", name: "Mina Sato", role: "Reliability mentor", stars: 4,
    text: "I score against a rubric the student already saw. No mystery grading, and no extra meetings to explain the mark." },
  { initials: "OH", name: "Olive Hart", role: "Northwind Pumps", stars: 5,
    text: "We got a usable vibration summary in two weeks. The student had never been on a plant floor." },
  { initials: "KM", name: "Kofi Mensah", role: "Kestrel Analytics", stars: 4,
    text: "Paid a fixed fee, got a cleaned dataset and a note of what was still messy. That is the whole deal I wanted." },
];

function Logos({ label, names }: { label: string; names: string[] }) {
  const row = (dup = false) => (
    <ul className={dup ? "logo-dup" : undefined} aria-hidden={dup || undefined}>
      {names.map((n) => (
        <li key={n}>
          <span className="inline-flex h-11 items-center rounded-md border bg-background px-4 text-sm font-medium text-muted-foreground">{n}</span>
        </li>
      ))}
    </ul>
  );
  return (
    <section className="grid gap-3">
      <h2 className="text-center text-sm font-medium text-muted-foreground">{label}</h2>
      <div className="logo-marquee">
        <div className="logo-track">
          {row()}
          {row(true)}
        </div>
      </div>
    </section>
  );
}

function Landing() {
  return (
    <>
      <InteractiveHero>
        <div className="hero-glow" aria-hidden><span className="a" /><span className="b" /><span className="c" /></div>
        <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 px-4 pt-16 pb-12 sm:pt-24 sm:pb-16 lg:grid-cols-[minmax(0,1fr)_25rem]">
          <div>
            <p className="hero-in mb-4 inline-flex rounded-full border border-primary/20 bg-background/70 px-3 py-1 text-sm font-medium text-primary shadow-sm backdrop-blur">Real projects. Real mentors. Proven skills.</p>
            <h1 className="hero-in max-w-3xl text-4xl font-semibold tracking-tight text-balance sm:text-6xl" style={{ animationDelay: "80ms" }}>
              Go from "I studied this" to "here's the work I did, and who reviewed it."
            </h1>
            <p className="hero-in mt-5 max-w-xl text-lg leading-relaxed text-muted-foreground" style={{ animationDelay: "160ms" }}>
              No prior industry experience needed. Start with a beginner project and work up from there.
            </p>
            <div className="hero-in mt-8 flex flex-wrap gap-3" style={{ animationDelay: "240ms" }}>
              <Button asChild size="lg"><Link href="/explore">Browse projects <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><Link href="/sign-up">Create an account</Link></Button>
            </div>
          </div>
          <div className="hero-visual hero-in mx-auto hidden w-full sm:block" aria-hidden style={{ animationDelay: "280ms" }}>
            <div className="hero-wave-frame">
              <div className="hero-wave-label"><span /> Project pulse</div>
              <svg className="hero-art" viewBox="0 0 440 340">
                <defs>
                  <linearGradient id="wave-gradient" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="currentColor" stopOpacity=".14" />
                    <stop offset="1" stopColor="currentColor" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path className="wave-fill" d="M-30 190 C45 68 114 282 198 164 S350 76 480 174 L480 360 L-30 360Z" />
                <g className="wave-flow">
                  <path className="line a" d="M-30 178 C45 56 114 270 198 152 S350 64 480 162" />
                  <path className="line b" d="M-30 216 C65 122 124 286 218 198 S362 118 480 206" />
                  <path className="line c" d="M-30 132 C65 28 142 214 232 116 S366 38 480 124" />
                </g>
                <circle className="ring a" cx="82" cy="106" r="11" />
                <circle className="dot a" cx="82" cy="106" r="5" />
                <circle className="ring b" cx="232" cy="116" r="10" />
                <circle className="dot b" cx="232" cy="116" r="4" />
                <circle className="ring c" cx="354" cy="103" r="12" />
                <circle className="dot c" cx="354" cy="103" r="5" />
              </svg>
              <div className="hero-proof-card">
                <BadgeCheck className="size-5 text-primary" />
                <div><strong>Evidence accepted</strong><span>Verified by a named mentor</span></div>
              </div>
            </div>
          </div>
          <div id="how-it-works" className="hero-in mt-8 grid scroll-mt-20 gap-4 sm:grid-cols-3 lg:col-span-2" style={{ animationDelay: "320ms" }}>
            {STEPS.map((s) => (
              <Card key={s.title} className="lift bg-background/80 shadow-sm backdrop-blur">
                <CardHeader>
                  <s.icon className="mb-2 size-6 text-primary" aria-hidden />
                  <CardTitle>{s.title}</CardTitle>
                  <CardDescription>{s.text}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </InteractiveHero>
      <div className="border-t bg-background">
        <div className="mx-auto grid max-w-6xl gap-16 px-4 py-16 sm:py-20">
          <div className="grid gap-8">
            <p className="text-center text-xs text-muted-foreground">Placeholder names until the first partners are listed.</p>
            <Logos label="Universities" names={UNIVERSITIES} />
            <Logos label="Companies" names={COMPANIES} />
          </div>
          <Quotes quotes={QUOTES} />
        </div>
      </div>
    </>
  );
}

export default async function Home() {
  const session = await getSession();
  if (!session) return <Landing />;

  const db = getDb();
  const roles = await getRoles(db, session.user.id);
  if (!roles.isStudent && !roles.isStaff && !roles.ownerOf.length && !roles.mentorOf.length) redirect("/onboarding");
  const today = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", timeZone: "UTC" });
  return (
    <Page title={`Welcome back, ${session.user.name.split(" ")[0]}`} description={today}>
      <div className="grid gap-10">
        {roles.isStaff && <StaffDashboard db={db} />}
        {roles.ownerOf.length > 0 && <OwnerDashboard db={db} roles={roles} />}
        {roles.mentorOf.length > 0 && <MentorDashboard db={db} userId={session.user.id} />}
        {roles.isStudent && <StudentDashboard db={db} userId={session.user.id} />}
      </div>
    </Page>
  );
}
