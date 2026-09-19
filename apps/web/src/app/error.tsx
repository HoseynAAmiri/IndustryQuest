"use client";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-3 px-4 py-20 text-center" role="alert">
      <h1 className="text-2xl font-semibold">Something went wrong on our side</h1>
      <p className="text-muted-foreground">Nothing you submitted was lost. Try again, and if it keeps happening, tell program staff.</p>
      <div className="mt-2 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline"><Link href="/">Go home</Link></Button>
      </div>
    </div>
  );
}
