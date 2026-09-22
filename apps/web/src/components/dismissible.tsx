"use client";
import { useState, type ReactNode } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

// A one-time explainer. Closing it sets a cookie, and the page skips rendering it while `hide_<id>` is set.
export function Dismissible({ id, children }: { id: string; children: ReactNode }) {
  const [open, setOpen] = useState(true);
  if (!open) return null;
  return (
    <div className="relative rounded-xl border bg-card p-4 pr-12 text-sm text-muted-foreground">
      {children}
      <Button variant="ghost" size="icon-sm" className="absolute top-2 right-2" aria-label="Dismiss"
        onClick={() => { document.cookie = `hide_${id}=1; path=/; max-age=31536000; samesite=lax`; setOpen(false); }}>
        <X />
      </Button>
    </div>
  );
}
