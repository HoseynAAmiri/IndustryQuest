import { eq } from "drizzle-orm";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import { user } from "@iq/db";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";

const TYPES = ["image/png", "image/jpeg", "image/webp"];

// PRO-01: optional profile photo, stored in R2 under the user's id.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const back = (key: string, msg: string) => Response.redirect(new URL(`/profile?tab=details&${key}=${encodeURIComponent(msg)}`, req.url), 303);
  const form = await req.formData();
  if (form.get("remove") === "1") {
    await getDb().update(user).set({ image: null }).where(eq(user.id, session.user.id));
    return back("info", "Photo removed.");
  }
  const file = form.get("photo");
  if (!(file instanceof File) || !file.size) return back("error", "Choose a photo.");
  if (!TYPES.includes(file.type)) return back("error", "Use a PNG, JPEG or WebP image.");
  if (file.size > 2 * 1024 * 1024) return back("error", "Photos can be up to 2 MB.");
  const key = `avatars/${session.user.id}`;
  await getCloudflareContext().env.FILES.put(key, await file.arrayBuffer(), { httpMetadata: { contentType: file.type } });
  await getDb().update(user).set({ image: `r2:${key}`, updatedAt: new Date() }).where(eq(user.id, session.user.id));
  return back("info", "Photo updated.");
}
