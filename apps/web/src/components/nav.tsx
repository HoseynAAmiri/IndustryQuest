import Link from "next/link";
import { Compass } from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Button } from "@/components/ui/button";
import { getSession } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";

export async function Nav() {
  const session = await getSession();
  const roles = session && (await getRoles(getDb(), session.user.id));
  const links = [
    { href: "/explore", label: "Explore", show: true },
    { href: "/quests", label: "My quests", show: roles?.isStudent },
    { href: "/profile", label: "Profile", show: roles?.isStudent },
    { href: "/company", label: "Company", show: !!roles?.ownerOf.length },
    { href: "/mentor", label: "Mentor", show: !!roles?.mentorOf.length },
    { href: "/staff", label: "Staff", show: roles?.isStaff },
  ].filter((l) => l.show);
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-background focus:p-2">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-5xl items-center gap-1 px-4">
        <Link href="/" className="mr-4 flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><Compass className="size-4" /></span>
          IndustryQuest
        </Link>
        <div className="flex flex-1 flex-wrap items-center gap-1">
          {links.map((l) => (
            <Button key={l.href} asChild variant="ghost" size="sm"><Link href={l.href}>{l.label}</Link></Button>
          ))}
        </div>
        {session ? (
          <form action={signOut} className="flex items-center gap-3">
            <span className="hidden text-sm text-muted-foreground sm:inline">{session.user.name}</span>
            <Button variant="outline" size="sm">Sign out</Button>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button asChild variant="ghost" size="sm"><Link href="/sign-in">Sign in</Link></Button>
            <Button asChild size="sm"><Link href="/sign-up">Create account</Link></Button>
          </div>
        )}
      </nav>
    </header>
  );
}
