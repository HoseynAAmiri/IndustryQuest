"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2, ChevronsUpDown, ClipboardCheck, Compass, House, LogOut, ShieldCheck, Target, UserRound, Users,
} from "lucide-react";
import { signOut } from "@/app/(auth)/actions";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader,
  SidebarMenu, SidebarMenuBadge, SidebarMenuButton, SidebarMenuItem, SidebarRail,
} from "@/components/ui/sidebar";

const ICONS = { home: House, explore: Compass, quests: Target,  company: Building2, mentor: ClipboardCheck, staff: ShieldCheck };
export type NavGroup = { label: string; items: { href: string; label: string; icon: keyof typeof ICONS; badge?: number }[] };

const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

export function AppSidebar({ groups, user, demo, hasProfile }: { groups: NavGroup[]; user: { name: string; email: string }; demo: boolean; hasProfile: boolean }) {
  const path = usePathname();
  // Highlight only the most specific match, so /profile/skills doesn't also light up /profile.
  const matches = (href: string) => (href === "/" ? path === "/" : path === href || path.startsWith(`${href}/`));
  const best = groups.flatMap((g) => g.items.map((i) => i.href)).filter(matches).sort((a, b) => b.length - a.length)[0];
  const active = (href: string) => href === best;
  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild className="group-data-[collapsible=icon]:p-0!">
              <Link href="/">
                <span className="grid size-8 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Compass className="size-4" /></span>
                <span className="grid leading-tight group-data-[collapsible=icon]:hidden">
                  <span className="font-semibold tracking-tight">IndustryQuest</span>
                  <span className="text-xs text-muted-foreground">Real projects, real mentors</span>
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {groups.map((g) => (
          <SidebarGroup key={g.label}>
            <SidebarGroupLabel>{g.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {g.items.map((item) => {
                  const Icon = ICONS[item.icon];
                  return (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton asChild isActive={active(item.href)} tooltip={item.label}>
                        <Link href={item.href} aria-current={active(item.href) ? "page" : undefined}><Icon /> <span>{item.label}</span></Link>
                      </SidebarMenuButton>
                      {!!item.badge && <SidebarMenuBadge aria-label={`${item.badge} waiting`}>{item.badge}</SidebarMenuBadge>}
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" className="data-[state=open]:bg-sidebar-accent group-data-[collapsible=icon]:p-0!">
                  <Avatar className="size-8 shrink-0 rounded-md"><AvatarFallback className="rounded-md bg-primary/10 text-primary">{initials(user.name)}</AvatarFallback></Avatar>
                  <span className="grid flex-1 text-left leading-tight">
                    <span className="truncate font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  <ChevronsUpDown className="ml-auto size-4" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-(--radix-dropdown-menu-trigger-width) min-w-56">
                <DropdownMenuLabel className="font-normal text-muted-foreground">Signed in as {user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {hasProfile && (
                  <DropdownMenuItem asChild><Link href="/profile"><UserRound /> Profile</Link></DropdownMenuItem>
                )}
                {demo && (
                  <DropdownMenuItem asChild><Link href="/sign-in"><Users /> Switch demo persona</Link></DropdownMenuItem>
                )}
                <form action={signOut}>
                  <DropdownMenuItem asChild><button type="submit" className="w-full"><LogOut /> Sign out</button></DropdownMenuItem>
                </form>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
