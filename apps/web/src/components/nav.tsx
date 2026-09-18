import Link from "next/link";
import { signOut } from "@/app/(auth)/actions";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

const link = "rounded px-2 py-1 hover:bg-slate-100 focus:outline-2 focus:outline-blue-700";

export async function Nav() {
  const session = await getSession();
  const roles = session && (await getRoles(getDb(), session.user.id));
  return (
    <header className="border-b border-slate-200">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:p-2">Skip to content</a>
      <nav aria-label="Main" className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
        <Link href="/" className="mr-4 font-semibold">IndustryQuest</Link>
        <Link href="/explore" className={link}>Explore</Link>
        {roles?.isStudent && <Link href="/quests" className={link}>My quests</Link>}
        {roles?.isStudent && <Link href="/profile" className={link}>Profile</Link>}
        {roles && roles.ownerOf.length > 0 && <Link href="/company" className={link}>Company</Link>}
        {roles && roles.mentorOf.length > 0 && <Link href="/mentor" className={link}>Mentor</Link>}
        {roles?.isStaff && <Link href="/staff" className={link}>Staff</Link>}
        <span className="ml-auto" />
        {session ? (
          <form action={signOut} className="flex items-center gap-3">
            <span className="text-sm text-slate-600">{session.user.name}</span>
            <button className={link}>Sign out</button>
          </form>
        ) : (
          <>
            <Link href="/sign-in" className={link}>Sign in</Link>
            <Link href="/sign-up" className={link}>Create account</Link>
          </>
        )}
      </nav>
    </header>
  );
}
