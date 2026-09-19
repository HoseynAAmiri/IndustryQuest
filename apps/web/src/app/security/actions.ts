"use server";
import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { requireUser, getAuth } from "@/server/auth";
import { getDb } from "@/server/db";
import { audit } from "@/server/notify";

const value = (f: FormData, key: string) => String(f.get(key) ?? "");
const fail = (e: unknown): never => redirect(`/security?error=${encodeURIComponent(e instanceof APIError ? e.body?.message ?? e.message : "Security setting could not be changed.")}`);

export async function enableTwoFactorAction(form: FormData) {
  const me = await requireUser();
  try {
    await getAuth().api.enableTwoFactor({ body: { password: value(form, "password"), method: "otp" }, headers: await headers() });
    await audit(getDb(), me.id, "two_factor_enabled", "user", me.id);
  } catch (e) { fail(e); }
  redirect("/security?info=Two-factor+sign-in+enabled.");
}

export async function disableTwoFactorAction(form: FormData) {
  const me = await requireUser();
  try {
    await getAuth().api.disableTwoFactor({ body: { password: value(form, "password") }, headers: await headers() });
    await audit(getDb(), me.id, "two_factor_disabled", "user", me.id);
  } catch (e) { fail(e); }
  redirect("/security?info=Two-factor+sign-in+disabled.");
}

export async function revokeOtherSessionsAction() {
  const me = await requireUser();
  try {
    await getAuth().api.revokeOtherSessions({ headers: await headers() });
    await audit(getDb(), me.id, "other_sessions_revoked", "user", me.id);
  } catch (e) { fail(e); }
  redirect("/security?info=Other+devices+signed+out.");
}
