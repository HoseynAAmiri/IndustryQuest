"use client";
import { useOptimistic } from "react";
import { Bookmark, BookmarkCheck } from "lucide-react";
import { toggleSave } from "@/app/explore/actions";
import { Button } from "@/components/ui/button";

// Flips as soon as the click starts. The server action confirms it without leaving the page.
export function SaveProject({ saved, projectId, back, title }: {
  saved: boolean; projectId: string; back: string; title?: string;
}) {
  const [on, setOn] = useOptimistic(saved);
  return (
    <form action={async (fd) => {
      setOn((v) => !v);
      await toggleSave(fd);
    }}>
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="back" value={back} />
      {title ? (
        <Button variant="ghost" size="icon-sm" aria-label={on ? `Unsave ${title}` : `Save ${title}`} aria-pressed={on}>
          {on ? <BookmarkCheck className="text-primary" /> : <Bookmark />}
        </Button>
      ) : (
        <Button variant="outline" className="w-full" aria-pressed={on}>
          {on ? <><BookmarkCheck className="text-primary" /> Saved</> : <><Bookmark /> Save for later</>}
        </Button>
      )}
    </form>
  );
}
