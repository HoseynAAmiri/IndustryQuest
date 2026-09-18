import "server-only";
import { redirect } from "next/navigation";
import { TransitionError } from "@iq/core";
import { UserError } from "./errors";

const withParam = (path: string, key: string, value: string) =>
  `${path}${path.includes("?") ? "&" : "?"}${key}=${encodeURIComponent(value)}`;

// Runs a domain call from a Server Action. Expected failures go back to the form as ?error=.
type Url = string | (() => string);
const url = (u: Url) => (typeof u === "function" ? u() : u);

// URLs may be functions so they can use ids created inside fn.
export async function act(back: Url, fn: () => Promise<unknown>, done: { to?: Url; info?: string } = {}) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof UserError) redirect(withParam(url(back), "error", e.message));
    if (e instanceof TransitionError) redirect(withParam(url(back), "error", "That action isn't available any more. The page may be out of date."));
    throw e;
  }
  const to = url(done.to ?? back);
  redirect(done.info ? withParam(to, "info", done.info) : to);
}
