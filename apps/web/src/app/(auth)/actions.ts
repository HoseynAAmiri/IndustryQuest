"use server";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { DEMO_PASSWORD, DEMO_PERSONAS } from "@iq/db";
import { getAuth } from "@/server/auth";
import { isDemo } from "@/server/demo";

const str = (f: FormData, k: string) => String(f.get(k) ?? "").trim();
const back = (path: string, error: string) => redirect(`${path}?error=${encodeURIComponent(error)}`);

async function attempt(fn: () => Promise<unknown>) {
  try {
    await fn();
    return null;
  } catch (e) {
    if (e instanceof APIError) return e.body?.message ?? e.message;
    throw e;
  }
}

export async function signUp(form: FormData) {
  const email = str(form, "email");
  const err = await attempt(() =>
    getAuth().api.signUpEmail({
      body: { name: str(form, "name"), email, password: String(form.get("password")), callbackURL: "/onboarding" },
    }),
  );
  if (err) back("/sign-up", err);
  redirect(`/check-email?email=${encodeURIComponent(email)}`);
}

export async function signIn(form: FormData) {
  const email = str(form, "email");
  const err = await attempt(async () =>
    getAuth().api.signInEmail({ body: { email, password: String(form.get("password")) }, headers: await headers() }),
  );
  if (err === "Email not verified") redirect(`/check-email?email=${encodeURIComponent(email)}&resent=1`);
  if (err) back("/sign-in", err);
  redirect("/");
}

export async function signOut() {
  await getAuth().api.signOut({ headers: await headers() });
  redirect("/");
}

export async function forgotPassword(form: FormData) {
  // Same reply whether or not the account exists, so the form can't be used to probe emails.
  await attempt(() => getAuth().api.requestPasswordReset({ body: { email: str(form, "email"), redirectTo: "/reset" } }));
  redirect(`/forgot?info=${encodeURIComponent("If that email has an account, a reset link is on its way.")}`);
}

export async function resetPassword(form: FormData) {
  const token = str(form, "token");
  const err = await attempt(() => getAuth().api.resetPassword({ body: { token, newPassword: String(form.get("password")) } }));
  if (err) redirect(`/reset?token=${encodeURIComponent(token)}&error=${encodeURIComponent(err)}`);
  redirect(`/sign-in?info=${encodeURIComponent("Password changed. Sign in with your new password.")}`);
}

// Demo mode only: one-click sign-in as a seeded fictional persona. Refuses any other email.
export async function demoSignIn(form: FormData) {
  const email = str(form, "email");
  if (!isDemo() || !DEMO_PERSONAS.some((p) => p.email === email)) back("/sign-in", "Demo sign-in is turned off.");
  const err = await attempt(async () =>
    getAuth().api.signInEmail({ body: { email, password: DEMO_PASSWORD }, headers: await headers() }),
  );
  if (err) back("/sign-in", `${err}. Run pnpm db:seed to create the demo accounts.`);
  redirect("/");
}
