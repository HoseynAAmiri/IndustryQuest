import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { loadWorkspace } from "@/server/workspace";

const esc = (s: string) => s.replaceAll("\\", "\\\\").replaceAll("\n", "\\n").replaceAll(",", "\\,").replaceAll(";", "\\;");
const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");

export async function GET(_request: Request, { params }: RouteContext<"/api/calendar/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const w = await loadWorkspace(getDb(), me, id);
  const now = stamp(new Date());
  const meeting = w.files.find(({ f }) => f.url && /meet|zoom|teams|call|check.?in/i.test(`${f.name} ${f.description}`))?.f.url;
  const events = w.milestones.map((m) => [
    "BEGIN:VEVENT", `UID:${m.id}@industryquest`, `DTSTAMP:${now}`, `DTSTART:${stamp(m.dueAt)}`,
    `SUMMARY:${esc(`${w.v.title}: ${m.title}`)}`, `DESCRIPTION:${esc(`IndustryQuest milestone for ${w.org.name}${meeting ? `\nMeeting: ${meeting}` : ""}`)}`,
    ...(meeting ? [`URL:${meeting}`] : []), "END:VEVENT",
  ].join("\r\n"));
  const body = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//IndustryQuest//Project milestones//EN", "CALSCALE:GREGORIAN", ...events, "END:VCALENDAR", ""].join("\r\n");
  return new Response(body, { headers: {
    "Content-Type": "text/calendar; charset=utf-8",
    "Content-Disposition": `attachment; filename="industryquest-${id}.ics"`,
    "Cache-Control": "private, no-store",
  } });
}
