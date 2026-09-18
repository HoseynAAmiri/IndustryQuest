import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, BadgeCheck, Briefcase, Users } from "lucide-react";
import { Button, Page } from "@/components/ui";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MentorDashboard, OwnerDashboard, StaffDashboard, StudentDashboard } from "./dashboard";
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
      <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
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
            <Card key={s.title} className="lift">
              <CardHeader>
                <s.icon className="mb-2 size-6 text-primary" aria-hidden />
                <CardTitle>{s.title}</CardTitle>
                <CardDescription>{s.text}</CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
    );

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
