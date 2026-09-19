import { and, eq } from "drizzle-orm";
import { notifications } from "@iq/db";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";

// Opening a notification marks it read, then follows its link (internal paths only).
export async function GET(req: Request, { params }: RouteContext<"/notifications/[id]">) {
  const session = await getSession();
  if (!session) return Response.redirect(new URL("/sign-in", req.url), 303);
  const [n] = await getDb().update(notifications).set({ readAt: new Date() })
    .where(and(eq(notifications.id, (await params).id), eq(notifications.userId, session.user.id))).returning().catch(() => []);
  const to = n?.href.startsWith("/") && !n.href.startsWith("//") ? n.href : "/notifications";
  return Response.redirect(new URL(to, req.url), 303);
}
