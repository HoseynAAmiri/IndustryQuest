import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { and, count, eq, isNull } from "drizzle-orm";
import Link from "next/link";
import { Bell } from "lucide-react";
import { notifications, organizations, projects } from "@iq/db";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { openCaseCount } from "@/server/cases";
import { isDemo } from "@/server/demo";
import { AppSidebar, type NavGroup } from "./app-sidebar";
import { DemoBadge } from "./public-header";
import { ThemeToggle } from "./theme";

// Signed-in layout: sidebar with a group per role the user holds, plus a slim header.
export async function AppShell({ user, children }: { user: { id: string; name: string; email: string }; children: ReactNode }) {
  const db = getDb();
  const roles = await getRoles(db, user.id);
  const groups: NavGroup[] = [{
    label: "Learn",
    items: [
      { href: "/", label: "Home", icon: "home" },
      { href: "/explore", label: "Explore projects", icon: "explore" },
      ...(roles.isStudent ? [{ href: "/quests", label: "My quests", icon: "quests" as const }] : []),
    ],
  }];
  if (roles.ownerOf.length) groups.push({ label: "Company", items: [{ href: "/company", label: "Projects", icon: "company" }] });
  if (roles.mentorOf.length) groups.push({ label: "Mentoring", items: [{ href: "/mentor", label: "Review queue", icon: "mentor" }] });
  if (roles.isStaff) {
    const [[briefs], [orgs]] = await Promise.all([
      db.select({ n: count() }).from(projects).where(eq(projects.state, "in_review")),
      db.select({ n: count() }).from(organizations).where(isNull(organizations.verifiedAt)),
    ]);
    groups.push({ label: "Operations", items: [
      { href: "/staff", label: "Staff queue", icon: "staff", badge: briefs.n + orgs.n },
      { href: "/staff/cases", label: "Cases", icon: "cases", badge: await openCaseCount(db) },
    ] });
  }
  const open = (await cookies()).get("sidebar_state")?.value !== "false";
  const [{ n: unread }] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider defaultOpen={open}>
      <AppSidebar groups={groups} user={{ name: user.name, email: user.email }} demo={isDemo()} hasProfile={roles.isStudent} />
      <SidebarInset id="main">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
          {isDemo() && <DemoBadge />}
          <div className="ml-auto flex items-center gap-1">
            <Button asChild variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}>
              <Link href="/notifications">
                <Bell />
                {unread > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 grid min-w-4 place-items-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground motion-safe:animate-in motion-safe:zoom-in-50">
                    {unread > 9 ? "9+" : unread}
                  </span>
                )}
              </Link>
            </Button>
            <ThemeToggle />
          </div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
