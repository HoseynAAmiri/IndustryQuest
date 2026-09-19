import { count, eq } from "drizzle-orm";
import { session, user } from "@iq/db";
import { Alert, Button, Field, Page, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { isDemo } from "@/server/demo";
import { disableTwoFactorAction, enableTwoFactorAction, revokeOtherSessionsAction } from "./actions";

export default async function Security({ searchParams }: PageProps<"/security">) {
  const me = await requireUser();
  const db = getDb();
  const { error } = await messages(searchParams);
  const [[account], [sessions], roles] = await Promise.all([
    db.select({ twoFactorEnabled: user.twoFactorEnabled }).from(user).where(eq(user.id, me.id)),
    db.select({ n: count() }).from(session).where(eq(session.userId, me.id)), getRoles(db, me.id),
  ]);
  const privileged = roles.isStaff || roles.ownerOf.length > 0;
  return <Page narrow title="Security" description="Password recovery uses your confirmed email address.">
    <div className="grid gap-4"><Alert>{error}</Alert>
      {isDemo() && <Alert tone="info">Two-factor enforcement is bypassed for fictional demo personas.</Alert>}
      <Card><form action={account.twoFactorEnabled ? disableTwoFactorAction : enableTwoFactorAction}>
        <CardHeader><CardTitle className="text-base">Email two-factor sign-in</CardTitle><CardDescription>
          {account.twoFactorEnabled ? "On. Sign-in needs your password and a short-lived email code." : privileged ? "Required for staff and organization owners before protected changes." : "Optional for this account."}
        </CardDescription></CardHeader><CardContent className="grid gap-3 pt-4">
          <Field label="Current password" name="password" type="password" autoComplete="current-password" required />
          <Button size="sm" variant={account.twoFactorEnabled ? "outline" : "default"} className="justify-self-start">{account.twoFactorEnabled ? "Turn off" : "Turn on"}</Button>
        </CardContent>
      </form></Card>
      <Card><CardHeader><CardTitle className="text-base">Signed-in devices</CardTitle><CardDescription>{sessions.n} active {sessions.n === 1 ? "session" : "sessions"}.</CardDescription></CardHeader>
        <CardContent><form action={revokeOtherSessionsAction}><Button size="sm" variant="outline">Sign out other devices</Button></form></CardContent>
      </Card>
    </div>
  </Page>;
}
