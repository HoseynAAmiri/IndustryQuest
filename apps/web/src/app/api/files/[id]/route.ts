import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { Forbidden } from "@/server/errors";
import { fileForDownload } from "@/server/workspace";

// AC-08: direct file URLs go through the same server-side check as the workspace page.
export async function GET(req: Request, { params }: RouteContext<"/api/files/[id]">) {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  let f;
  try {
    f = await fileForDownload(getDb(), session.user, (await params).id);
  } catch (e) {
    if (e instanceof Forbidden) return new Response("Not found or no access.", { status: 404 });
    throw e;
  }
  if (f.url) return Response.redirect(f.url, 302);
  const obj = await getCloudflareContext().env.FILES.get(f.r2Key!);
  if (!obj) return new Response("This file is no longer stored.", { status: 410 });
  return new Response(obj.body, {
    headers: {
      "Content-Type": f.contentType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(f.name)}`,
      "Cache-Control": "private, no-store",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
