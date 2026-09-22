import type { Metadata } from "next";
import { and, count, desc, eq, isNotNull, isNull } from "drizzle-orm";
import Link from "next/link";
import { BellOff, ChevronLeft, ChevronRight, Mail, MailOpen } from "lucide-react";
import { notificationPrefs, notifications, studentProfiles } from "@iq/db";
import { Button, CheckField, Field, Page, SelectField, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { markAllRead, savePrefs, toggleRead } from "./actions";

const PER_PAGE = 25;
const SHOW = { all: "All", unread: "Unread", read: "Read" } as const;
type Show = keyof typeof SHOW;
const href = (show: Show, page = 1) => {
  const q = new URLSearchParams({ ...(show !== "all" && { show }), ...(page > 1 && { page: String(page) }) }).toString();
  return q ? `/notifications?${q}` : "/notifications";
};

export const metadata: Metadata = { title: "Notifications" };

export default async function Notifications({ searchParams }: PageProps<"/notifications">) {
  const me = await requireUser();
  const db = getDb();
  const sp = await searchParams;
  const page = Math.max(1, Math.floor(Number(sp.page)) || 1);
  const show: Show = sp.show === "unread" || sp.show === "read" ? sp.show : "all";
  const back = href(show, page);
  // One extra row tells us whether an older page exists.
  const rows = await db.select().from(notifications)
    .where(and(eq(notifications.userId, me.id), show === "unread" ? isNull(notifications.readAt) : show === "read" ? isNotNull(notifications.readAt) : undefined))
    .orderBy(desc(notifications.createdAt), desc(notifications.id)).limit(PER_PAGE + 1).offset((page - 1) * PER_PAGE);
  const items = rows.slice(0, PER_PAGE);
  const [{ n: unread }] = await db.select({ n: count() }).from(notifications).where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
  const [prefs] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, me.id));
  const [profile] = await db.select({ tz: studentProfiles.timezone }).from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  const tz = prefs?.timezone ?? profile?.tz ?? "UTC";
  const hours = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

  return (
    <Page title="Notifications" description="Decisions, offers, reviews and messages. Past items stay here after you read them."
      actions={
        <div className="flex flex-wrap items-center gap-2">
          <nav aria-label="Filter notifications" className="inline-flex rounded-lg bg-muted p-[3px]">
            {(Object.keys(SHOW) as Show[]).map((s) => (
              <Link key={s} href={href(s)} aria-current={s === show ? "page" : undefined}
                className={`rounded-md px-3 py-1 text-sm font-medium ${s === show ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
                {SHOW[s]}{s === "unread" && unread > 0 && ` (${unread})`}
              </Link>
            ))}
          </nav>
          {unread > 0 && <form action={markAllRead}><Button variant="outline">Mark all as read</Button></form>}
        </div>
      }>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="py-0">
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id} className={`flex items-start ${n.readAt ? "" : "bg-primary/5"}`}>
                <a href={`/notifications/${n.id}`} className="press flex min-w-0 flex-1 gap-3 p-4 hover:bg-muted/50">
                  <span className={`mt-2 size-2 shrink-0 rounded-full ${n.readAt ? "bg-transparent" : "bg-primary"}`} aria-hidden />
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className={n.readAt ? "" : "font-medium"}>{n.title}</span>
                      {!n.readAt && <span className="sr-only">(unread)</span>}
                      {n.essential && <Badge variant="outline">Important</Badge>}
                    </span>
                    {n.body && <span className="block text-sm text-muted-foreground">{n.body}</span>}
                    <span className="block text-xs text-muted-foreground">{when(n.createdAt, tz, true)}{n.emailedAt && " · also emailed"}</span>
                  </span>
                </a>
                <form action={toggleRead} className="p-3">
                  <input type="hidden" name="id" value={n.id} />
                  <input type="hidden" name="back" value={back} />
                  <Button variant="ghost" size="icon-sm" aria-label={n.readAt ? `Mark "${n.title}" as unread` : `Mark "${n.title}" as read`}
                    title={n.readAt ? "Mark as unread" : "Mark as read"}>
                    {n.readAt ? <Mail /> : <MailOpen />}
                  </Button>
                </form>
              </li>
            ))}
            {!items.length && <li className="grid justify-items-center gap-2 p-10 text-center text-muted-foreground"><BellOff className="size-6" />{page > 1 ? "No older notifications." : show === "unread" ? "You're all caught up." : show === "read" ? "Nothing read yet." : "Nothing yet."}</li>}
          </ul>
          {(page > 1 || rows.length > PER_PAGE) && (
            <nav aria-label="Notification pages" className="flex items-center justify-between border-t p-3">
              {page > 1 ? <Button asChild variant="ghost" size="sm"><Link href={href(show, page - 1)}><ChevronLeft /> Newer</Link></Button> : <span />}
              <span className="text-xs text-muted-foreground">Page {page}</span>
              {rows.length > PER_PAGE ? <Button asChild variant="ghost" size="sm"><Link href={href(show, page + 1)}>Older <ChevronRight /></Link></Button> : <span />}
            </nav>
          )}
        </Card>
        <Card className="h-fit">
          <form action={savePrefs}>
            <CardHeader>
              <CardTitle className="text-base">Email settings</CardTitle>
              <CardDescription>Offers, decisions, reviews and account messages are always emailed. You choose for the rest.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 pt-4">
              <CheckField name="emailOptional" label="Email me about messages and updates" defaultChecked={prefs?.emailOptional ?? true} />
              <div className="grid grid-cols-2 gap-3">
                <SelectField label="Quiet from" name="quietStart" defaultValue={String(prefs?.quietStart ?? 22)} options={hours} />
                <SelectField label="Until" name="quietEnd" defaultValue={String(prefs?.quietEnd ?? 7)} options={hours} />
              </div>
              <SelectField label="In timezone" name="timezone" defaultValue={tz}
                options={Intl.supportedValuesOf("timeZone").map((z) => ({ value: z, label: z.replaceAll("_", " ") }))} />
              <p className="text-xs text-muted-foreground">During quiet hours optional emails are skipped. You'll still see everything here.</p>
            </CardContent>
            <CardFooter className="mt-4"><Button type="submit">Save</Button></CardFooter>
          </form>
        </Card>
      </div>
    </Page>
  );
}
