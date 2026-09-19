import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { when } from "@/components/ui";

export const CASE_STATUS = { open: ["Open", "default"], in_progress: ["In progress", "secondary"], resolved: ["Resolved", "outline"] } as const;
export const CaseStatus = ({ s }: { s: keyof typeof CASE_STATUS }) => <Badge variant={CASE_STATUS[s][1]}>{CASE_STATUS[s][0]}</Badge>;

export function Thread({ items, tz }: { items: { id: string; author: string; body: string; createdAt: Date }[]; tz: string }): ReactNode {
  return (
    <ol className="grid gap-3">
      {items.map((u) => (
        <li key={u.id} className="rounded-lg bg-muted/50 p-3 text-sm">
          <p className="mb-1 text-xs text-muted-foreground">{u.author} · {when(u.createdAt, tz, true)}</p>
          <p className="whitespace-pre-line">{u.body}</p>
        </li>
      ))}
    </ol>
  );
}
