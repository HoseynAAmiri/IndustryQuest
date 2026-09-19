import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { schema, type Db } from "@iq/db";
import { getDb } from "./db";
import { sendEmail } from "./email";

export function makeAuth(db: Db) {
  return betterAuth({
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL,
    database: drizzleAdapter(db, { provider: "pg", schema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true,
      minPasswordLength: 10,
      sendResetPassword: ({ user, url }) =>
        sendEmail(user.email, "Reset your IndustryQuest password", `Open this link to choose a new password:\n${url}\n\nThe link expires in one hour. If you didn't ask for this, ignore this email.`),
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: ({ user, url }) =>
        sendEmail(user.email, "Confirm your IndustryQuest email", `Open this link to confirm your email address:\n${url}`),
    },
    // ACC-05, AC-16: moving from a university address to a personal one. The link goes to the new address,
    // and the switch happens only when it's opened.
    user: { additionalFields: { isStaff: { type: "boolean", input: false, defaultValue: false } }, changeEmail: { enabled: true } },
    plugins: [nextCookies()],
  });
}

export const getAuth = cache(() => makeAuth(getDb()));

// Read headers first: that marks the route dynamic before anything touches the Cloudflare context.
export const getSession = cache(async () => {
  const h = await headers();
  return getAuth().api.getSession({ headers: h });
});

export async function requireUser() {
  const session = await getSession();
  if (!session) redirect("/sign-in");
  return session.user;
}
