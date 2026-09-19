"use client";
import { useEffect, useRef, useState } from "react";

// EXP-08, WRK-10: put inside a form. After the first edit it shows "Unsaved changes" and the browser
// asks before leaving; submitting the form clears it.
export function UnsavedGuard() {
  const ref = useRef<HTMLSpanElement>(null);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    const form = ref.current?.closest("form");
    if (!form) return;
    const mark = () => setDirty(true);
    const clear = () => setDirty(false);
    form.addEventListener("input", mark);
    form.addEventListener("submit", clear);
    return () => { form.removeEventListener("input", mark); form.removeEventListener("submit", clear); };
  }, []);
  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);
  return <span ref={ref} role="status" className="text-xs text-amber-700 dark:text-amber-400">{dirty ? "Unsaved changes" : ""}</span>;
}
