import type { ReactNode } from "react";
import { cookies } from "next/headers";
import { count, eq, isNull } from "drizzle-orm";
import { organizations, projects } from "@iq/db";
import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
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
      ...(roles.isStudent ? [
        { href: "/quests", label: "My quests", icon: "quests" as const },
        { href: "/profile/skills", label: "My skills", icon: "skills" as const },
        { href: "/profile", label: "Profile", icon: "profile" as const },
      ] : []),
    ],
  }];
  if (roles.ownerOf.length) groups.push({ label: "Company", items: [{ href: "/company", label: "Projects", icon: "company" }] });
  if (roles.mentorOf.length) groups.push({ label: "Mentoring", items: [{ href: "/mentor", label: "Review queue", icon: "mentor" }] });
  if (roles.isStaff) {
    const [[briefs], [orgs]] = await Promise.all([
      db.select({ n: count() }).from(projects).where(eq(projects.state, "in_review")),
      db.select({ n: count() }).from(organizations).where(isNull(organizations.verifiedAt)),
    ]);
    groups.push({ label: "Operations", items: [{ href: "/staff", label: "Staff queue", icon: "staff", badge: briefs.n + orgs.n }] });
  }
  const open = (await cookies()).get("sidebar_state")?.value !== "false";
  return (
    <TooltipProvider delayDuration={0}>
    <SidebarProvider defaultOpen={open}>
      <AppSidebar groups={groups} user={{ name: user.name, email: user.email }} demo={isDemo()} />
      <SidebarInset id="main">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-2 border-b bg-background/90 px-4 backdrop-blur">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 data-[orientation=vertical]:h-5" />
          {isDemo() && <DemoBadge />}
          <div className="ml-auto"><ThemeToggle /></div>
        </header>
        {children}
      </SidebarInset>
    </SidebarProvider>
    </TooltipProvider>
  );
}
