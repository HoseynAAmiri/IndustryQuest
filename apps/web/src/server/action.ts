import "server-only";
import { redirect } from "next/navigation";
import { TransitionError } from "@iq/core";
import { UserError } from "./errors";

// Query goes before any #fragment, or the browser treats it as part of the fragment.
function withParam(path: string, key: string, value: string) {
  const [base, hash] = path.split("#");
  return `${base}${base.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}${hash ? `#${hash}` : ""}`;
}

// Runs a domain call from a Server Action. Expected failures go back to the form as ?error=.
type Url = string | (() => string);
const url = (u: Url) => (typeof u === "function" ? u() : u);

// URLs may be functions so they can use ids created inside fn.
export async function act<T>(back: Url, fn: () => Promise<T>, done: {
  to?: Url; info?: string; params?: (result: T) => Record<string, string>;
} = {}) {
  let result: T;
  try {
    result = await fn();
  } catch (e) {
    if (e instanceof UserError) redirect(withParam(url(back), "error", e.message));
    if (e instanceof TransitionError) redirect(withParam(url(back), "error", "That action isn't available any more. The page may be out of date."));
    throw e;
  }
  let to = url(done.to ?? back);
  if (done.info) to = withParam(to, "info", done.info);
  for (const [key, value] of Object.entries(done.params?.(result) ?? {})) to = withParam(to, key, value);
  redirect(to);
}
