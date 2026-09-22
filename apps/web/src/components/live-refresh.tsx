"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

// Re-renders the current page from the server so other users' actions (new applications, reviews,
// notifications) show up without a reload. Client state and typed form input survive a refresh.
// ponytail: polling, one full page render per tab every 15s. Push over a Durable Object if load grows.
export function LiveRefresh() {
  const router = useRouter();
  useEffect(() => {
    const tick = () => { if (document.visibilityState === "visible") router.refresh(); };
    const id = setInterval(tick, 15_000);
    document.addEventListener("visibilitychange", tick);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", tick); };
  }, [router]);
  return null;
}
