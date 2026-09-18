import Link from "next/link";
import { Compass, FlaskConical } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { isDemo } from "@/server/demo";
import { ThemeToggle } from "./theme";

export function DemoBadge() {
  return (
    <Badge variant="secondary" className="gap-1" title="Every company, person and result here is made up.">
      <FlaskConical className="size-3" /> Demo · fictional data
    </Badge>
  );
}

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:rounded focus:bg-background focus:p-2">
        Skip to content
      </a>
      <nav aria-label="Main" className="mx-auto flex h-14 max-w-6xl items-center gap-2 px-4">
        <Link href="/" className="mr-2 flex items-center gap-2 font-semibold tracking-tight">
          <span className="grid size-7 place-items-center rounded-md bg-primary text-primary-foreground"><Compass className="size-4" /></span>
          IndustryQuest
        </Link>
        <Button asChild variant="ghost" size="sm"><Link href="/explore">Explore projects</Link></Button>
        {isDemo() && <span className="hidden sm:inline"><DemoBadge /></span>}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <Button asChild variant="ghost" size="sm"><Link href="/sign-in">Sign in</Link></Button>
          <Button asChild size="sm"><Link href="/sign-up">Create account</Link></Button>
        </div>
      </nav>
    </header>
  );
}
