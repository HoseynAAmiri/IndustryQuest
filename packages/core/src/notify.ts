// NTF-02/03: essential messages (offers, decisions, account) always go by email. Optional ones
// respect the user's choice and quiet hours in their own timezone; they still appear in-app.
export type Prefs = { emailOptional: boolean; quietStart: number; quietEnd: number; timezone: string };

export function localHour(now: Date, timeZone: string) {
  return Number(new Intl.DateTimeFormat("en-GB", { hour: "numeric", hourCycle: "h23", timeZone }).format(now));
}

export function inQuietHours(hour: number, start: number, end: number) {
  return start === end ? false : start < end ? hour >= start && hour < end : hour >= start || hour < end;
}

export function shouldEmail(essential: boolean, p: Prefs, now = new Date()) {
  if (essential) return true;
  if (!p.emailOptional) return false;
  return !inQuietHours(localHour(now, p.timezone), p.quietStart, p.quietEnd);
}
