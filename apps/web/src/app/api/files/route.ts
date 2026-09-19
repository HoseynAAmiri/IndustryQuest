import { getCloudflareContext } from "@opennextjs/cloudflare";
import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { UserError } from "@/server/errors";
import { assertWorkspaceOpen, recordUpload } from "@/server/workspace";

const MAX = 10 * 1024 * 1024;
const TYPES = /\.(pdf|png|jpe?g|csv|txt|md|ipynb|py|json|zip|xlsx|docx|pptx)$/i;

// PRD §16.1: validate uploads, limit size and type, check access on the server before storing.
// ponytail: no malware scan yet; add a scanning step before real participant data arrives.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const form = await req.formData();
  const enrollmentId = String(form.get("enrollmentId") ?? "");
  const back = (msg: string, key = "error") =>
    Response.redirect(new URL(`/workspace/${enrollmentId}?tab=files&${key}=${encodeURIComponent(msg)}`, req.url), 303);
  const file = form.get("file");
  if (!(file instanceof File) || !file.size) return back("Choose a file to upload.");
  if (file.size > MAX) return back("Files can be up to 10 MB. Share bigger ones as a link.");
  if (!TYPES.test(file.name)) return back("That file type isn't allowed. Use PDF, images, CSV, notebooks, code, Office files or ZIP.");
  const buf = await file.arrayBuffer();
  const sha256 = [...new Uint8Array(await crypto.subtle.digest("SHA-256", buf))].map((b) => b.toString(16).padStart(2, "0")).join("");
  const r2Key = `enrollments/${enrollmentId}/${crypto.randomUUID()}`;
  try {
    const db = getDb();
    // Access check runs before anything is stored.
    if ((await assertWorkspaceOpen(db, session.user, enrollmentId)) !== "student") return back("Only the student can add files here.");
    await getCloudflareContext().env.FILES.put(r2Key, buf, { httpMetadata: { contentType: file.type || "application/octet-stream" } });
    await recordUpload(db, session.user, { enrollmentId, name: file.name.slice(0, 200), r2Key, size: file.size, contentType: file.type, sha256, description: String(form.get("description") ?? "").slice(0, 300) });
  } catch (e) {
    if (e instanceof UserError) return back(e.message);
    throw e;
  }
  return back(`Uploaded ${file.name}.`, "info");
}
