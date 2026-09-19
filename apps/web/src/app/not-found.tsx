import Link from "next/link";
import { Button } from "@/components/ui/button";

// Same page for "missing" and "not yours", so private records can't be probed.
export default function NotFound() {
  return (
    <div className="mx-auto grid max-w-md justify-items-center gap-3 px-4 py-20 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="text-2xl font-semibold">We couldn't find that page</h1>
      <p className="text-muted-foreground">It may have moved, or it may belong to someone else. If a link brought you here, ask whoever shared it.</p>
      <div className="mt-2 flex gap-2">
        <Button asChild><Link href="/">Go home</Link></Button>
        <Button asChild variant="outline"><Link href="/explore">Explore projects</Link></Button>
      </div>
    </div>
  );
}
