import Link from "next/link";
import { redirect } from "next/navigation";
import { Page } from "@/components/ui";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

export default async function Home() {
  const session = await getSession();
  if (!session)
    return (
      <Page title="IndustryQuest">
        <p className="text-lg">Real projects. Real mentors. Proven skills.</p>
        <p className="mt-4 max-w-prose text-slate-700">
          Pick a small project from a real company. A named mentor reviews your work against a published rubric.
          Accepted work becomes a verified record you can share, and it opens harder projects.
        </p>
        <p className="mt-6 flex gap-4">
          <Link href="/explore" className="rounded bg-blue-700 px-4 py-2 font-medium text-white">Browse projects</Link>
          <Link href="/sign-up" className="rounded border border-blue-700 px-4 py-2 font-medium text-blue-700">Create an account</Link>
        </p>
      </Page>
    );

  const roles = await getRoles(getDb(), session.user.id);
  if (!roles.isStudent && !roles.isStaff && !roles.ownerOf.length && !roles.mentorOf.length) redirect("/onboarding");
  return (
    <Page title={`Welcome, ${session.user.name}`}>
      <ul className="list-disc space-y-2 pl-6">
        {roles.isStudent && <li><Link className="text-blue-700 underline" href="/quests">Your quests</Link> and your next milestone</li>}
        {roles.isStudent && <li><Link className="text-blue-700 underline" href="/explore">Find a project</Link> that fits your skills and time</li>}
        {roles.ownerOf.length > 0 && <li><Link className="text-blue-700 underline" href="/company">Company projects</Link>: drafts, applicants and results</li>}
        {roles.mentorOf.length > 0 && <li><Link className="text-blue-700 underline" href="/mentor">Mentor queue</Link>: reviews waiting for you</li>}
        {roles.isStaff && <li><Link className="text-blue-700 underline" href="/staff">Staff queue</Link>: organizations and briefs to approve</li>}
      </ul>
    </Page>
  );
}
