import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

export const inputClass =
  "mt-1 block w-full rounded border border-slate-400 px-3 py-2 focus:outline-2 focus:outline-offset-1 focus:outline-blue-700";

export function Field({ label, hint, name, ...props }: { label: string; hint?: string; name: string } & ComponentProps<"input">) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-sm text-slate-600">{hint}</span>}
      <input name={name} className={inputClass} {...props} />
    </label>
  );
}

export function TextArea({ label, hint, name, ...props }: { label: string; hint?: string; name: string } & ComponentProps<"textarea">) {
  return (
    <label className="block">
      <span className="font-medium">{label}</span>
      {hint && <span className="block text-sm text-slate-600">{hint}</span>}
      <textarea name={name} rows={4} className={inputClass} {...props} />
    </label>
  );
}

export function Button({ className = "", ...props }: ComponentProps<"button">) {
  return (
    <button
      className={`rounded bg-blue-700 px-4 py-2 font-medium text-white hover:bg-blue-800 focus:outline-2 focus:outline-offset-2 focus:outline-blue-700 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}

export function Alert({ children, tone = "error" }: { children: ReactNode; tone?: "error" | "info" }) {
  if (!children) return null;
  const styles = tone === "error" ? "border-red-700 bg-red-50 text-red-900" : "border-blue-700 bg-blue-50 text-blue-900";
  return <div role={tone === "error" ? "alert" : "status"} className={`rounded border-l-4 p-3 ${styles}`}>{children}</div>;
}

export function Page({ title, children, back }: { title: string; children: ReactNode; back?: { href: string; label: string } }) {
  return (
    <main id="main" className="mx-auto max-w-3xl px-4 py-8">
      {back && <Link href={back.href} className="text-sm text-blue-700 underline">← {back.label}</Link>}
      <h1 className="mb-6 text-2xl font-semibold">{title}</h1>
      {children}
    </main>
  );
}

// Messages travel through the URL after a server-action redirect, so forms work without client JS.
export async function messages(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const p = await searchParams;
  return { error: typeof p.error === "string" ? p.error : undefined, info: typeof p.info === "string" ? p.info : undefined };
}
