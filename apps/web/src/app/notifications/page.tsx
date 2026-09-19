import type { Metadata } from "next";
import { desc, eq } from "drizzle-orm";
import { BellOff } from "lucide-react";
import { notificationPrefs, notifications, studentProfiles } from "@iq/db";
import { Button, CheckField, Field, Page, SelectField, when } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { markAllRead, savePrefs } from "./actions";

export const metadata: Metadata = { title: "Notifications" };

export default async function Notifications() {
  const me = await requireUser();
  const db = getDb();
  const items = await db.select().from(notifications).where(eq(notifications.userId, me.id)).orderBy(desc(notifications.createdAt)).limit(100);
  const [prefs] = await db.select().from(notificationPrefs).where(eq(notificationPrefs.userId, me.id));
  const [profile] = await db.select({ tz: studentProfiles.timezone }).from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  const tz = prefs?.timezone ?? profile?.tz ?? "UTC";
  const unread = items.filter((n) => !n.readAt).length;
  const hours = Array.from({ length: 24 }, (_, h) => ({ value: String(h), label: `${String(h).padStart(2, "0")}:00` }));

  return (
    <Page title="Notifications" description="Decisions, offers, reviews and messages. Past items stay here after you read them."
      actions={unread > 0 ? <form action={markAllRead}><Button variant="outline">Mark all as read</Button></form> : undefined}>
      <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
        <Card className="py-0">
          <ul className="divide-y">
            {items.map((n) => (
              <li key={n.id}>
                <a href={`/notifications/${n.id}`} className={`press flex gap-3 p-4 hover:bg-muted/50 ${n.readAt ? "" : "bg-primary/5"}`}>
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
              </li>
            ))}
            {!items.length && <li className="grid justify-items-center gap-2 p-10 text-center text-muted-foreground"><BellOff className="size-6" />Nothing yet.</li>}
          </ul>
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
