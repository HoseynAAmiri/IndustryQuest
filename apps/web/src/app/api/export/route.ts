import { getSession } from "@/server/auth";
import { getDb } from "@/server/db";
import { exportRecord } from "@/server/profile";

// CRD-05, PRO-12: machine-readable copy of everything that belongs to the student.
export async function GET() {
  const session = await getSession();
  if (!session) return new Response("Sign in first.", { status: 401 });
  const data = await exportRecord(getDb(), session.user.id);
  return new Response(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="industryquest-record-${new Date().toISOString().slice(0, 10)}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
