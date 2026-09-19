"use client";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { toast } from "sonner";
import { undoVerification } from "@/app/staff/actions";

// Server actions redirect with ?info= or ?error= (works without JS). With JS, show them as toasts.
// info is removed from the URL so a refresh doesn't repeat it; error stays so the inline alert remains.
export function Flash() {
  const params = useSearchParams();
  const router = useRouter();
  const path = usePathname();
  useEffect(() => {
    const info = params.get("info");
    const error = params.get("error");
    if (error) toast.error(error, { id: `e:${error}`, duration: 8000 });
    if (!info) return;
    const orgId = params.get("undoOrg");
    const eventId = params.get("undoEvent");
    toast.success(info, {
      id: `i:${info}`, duration: orgId && eventId ? 10_000 : undefined,
      ...(orgId && eventId && { action: { label: "Undo", onClick: () => {
        const form = new FormData(); form.set("orgId", orgId); form.set("eventId", eventId); void undoVerification(form);
      } } }),
    });
    const next = new URLSearchParams(params);
    for (const key of ["info", "undoOrg", "undoEvent"]) next.delete(key);
    router.replace(`${path}${next.size ? `?${next}` : ""}${window.location.hash}`, { scroll: false });
  }, [params, path, router]);
  return null;
}
