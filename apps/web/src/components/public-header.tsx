import Link from "next/link";
import type { ReactNode } from "react";
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
        <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link href="/explore">Explore projects</Link></Button>
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

export function PublicFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/35">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="sm:col-span-2 lg:col-span-1">
          <Link href="/" className="inline-flex items-center gap-2 font-semibold tracking-tight">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Compass className="size-4" /></span>
            IndustryQuest
          </Link>
          <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">Student projects with a named mentor and a work record anyone can check.</p>
          {isDemo() && <div className="mt-5"><DemoBadge /></div>}
        </div>
        <nav aria-labelledby="footer-platform" className="grid content-start gap-3 text-sm">
          <h2 id="footer-platform" className="font-semibold">Platform</h2>
          <Link href="/explore" className="text-muted-foreground hover:text-foreground">Browse projects</Link>
          <Link href="/#how-it-works" className="text-muted-foreground hover:text-foreground">How it works</Link>
          <Link href="/#stories" className="text-muted-foreground hover:text-foreground">Demo stories</Link>
        </nav>
        <nav aria-labelledby="footer-account" className="grid content-start gap-3 text-sm">
          <h2 id="footer-account" className="font-semibold">Account</h2>
          <Link href="/sign-up" className="text-muted-foreground hover:text-foreground">Create an account</Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground">Sign in</Link>
          <Link href="/help" className="text-muted-foreground hover:text-foreground">Help centre</Link>
        </nav>
        <nav aria-labelledby="footer-company" className="grid content-start gap-3 text-sm">
          <h2 id="footer-company" className="font-semibold">IndustryQuest</h2>
          <Link href="/about" className="text-muted-foreground hover:text-foreground">About us</Link>
          <Link href="/contact" className="text-muted-foreground hover:text-foreground">Contact</Link>
          <a href="mailto:hello@industryquest.example" className="text-muted-foreground hover:text-foreground">Email the pilot team</a>
        </nav>
      </div>
      <div className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <p className="text-xs text-muted-foreground">© {new Date().getUTCFullYear()} IndustryQuest. Demo content and partner names are fictional.</p>
          <nav id="footer-social" aria-label="Social media" className="flex gap-1">
            <Social label="LinkedIn">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M20.45 20.45h-3.56v-5.57c0-1.33 0-3.04-1.85-3.04s-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13M7.12 20.45H3.56V9h3.56zM22.23 0H1.77A1.75 1.75 0 0 0 0 1.73v20.54C0 23.23.77 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.23 0" /></svg>
            </Social>
            <Social label="X">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-4.71-6.23-5.4 6.23H2.74l7.73-8.84L1.25 2.25H8.08l4.25 5.62zm-1.16 17.52h1.83L7.08 4.13H5.12z" /></svg>
            </Social>
            <Social label="Instagram">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M12 7.2A4.8 4.8 0 1 0 12 16.8 4.8 4.8 0 0 0 12 7.2m0 7.91A3.11 3.11 0 1 1 12 8.89a3.11 3.11 0 0 1 0 6.22M17.5 6.96a1.12 1.12 0 1 1-2.24 0 1.12 1.12 0 0 1 2.24 0M12 2.16c2.45 0 2.74.01 3.71.05 2.56.12 3.96 1.53 4.08 4.08.04.97.05 1.26.05 3.71s-.01 2.74-.05 3.71c-.12 2.54-1.52 3.96-4.08 4.08-.97.04-1.26.05-3.71.05s-2.74-.01-3.71-.05c-2.57-.12-3.96-1.54-4.08-4.08-.04-.97-.05-1.26-.05-3.71s.01-2.74.05-3.71c.12-2.55 1.52-3.96 4.08-4.08.97-.04 1.26-.05 3.71-.05M12 .54c-2.49 0-2.8.01-3.78.05C4.7.78 2.78 2.7 2.59 6.22 2.55 7.2 2.54 7.51 2.54 12s.01 4.8.05 5.78c.19 3.52 2.11 5.44 5.63 5.63 1 .04 1.3.05 3.78.05s2.8-.01 3.78-.05c3.51-.19 5.44-2.11 5.63-5.63.04-.98.05-1.29.05-5.78s-.01-4.8-.05-5.78C21.22 2.7 19.3.78 15.78.59 14.8.55 14.49.54 12 .54" /></svg>
            </Social>
            <Social label="YouTube">
              <svg viewBox="0 0 24 24" className="size-4" aria-hidden><path fill="currentColor" d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.54 3.55 12 3.55 12 3.55s-7.54 0-9.38.5A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.84.5 9.38.5 9.38.5s7.54 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81M9.55 15.57V8.43L15.82 12z" /></svg>
            </Social>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function Social({ label, children }: { label: string; children: ReactNode }) {
  return (
    <a href="#footer-social" aria-label={`${label} (placeholder)`} className="grid size-9 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground">
      {children}
    </a>
  );
}
