import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { studentProfiles, user } from "@iq/db";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";

// Photos show to signed-in people, and publicly only when the student shares their profile.
export async function GET(_req: Request, { params }: RouteContext<"/api/avatar/[id]">) {
  const id = (await params).id;
  const db = getDb();
  const [u] = await db.select({ image: user.image }).from(user).where(eq(user.id, id));
  if (!u?.image?.startsWith("r2:")) return new Response("No photo", { status: 404 });
  if (!(await getSession())) {
    const [p] = await db.select({ v: studentProfiles.visibility }).from(studentProfiles).where(eq(studentProfiles.userId, id));
    if (!p || p.v === "private") return new Response("No photo", { status: 404 });
  }
  const obj = await getCloudflareContext().env.FILES.get(u.image.slice(3));
  if (!obj) return new Response("No photo", { status: 404 });
  return new Response(obj.body, { headers: { "Content-Type": obj.httpMetadata?.contentType ?? "image/jpeg", "Cache-Control": "private, max-age=300" } });
}
