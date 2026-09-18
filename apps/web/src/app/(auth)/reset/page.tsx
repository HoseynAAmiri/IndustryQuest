import Link from "next/link";
import { Alert, Button, Field, Page, messages } from "@/components/ui";
import { resetPassword } from "../actions";

export default async function Reset({ searchParams }: PageProps<"/reset">) {
  const { error } = await messages(searchParams);
  const { token } = await searchParams;
  if (typeof token !== "string" || token === "INVALID_TOKEN")
    return (
      <Page title="This reset link doesn't work">
        <p>It may have expired or been used already. <Link className="text-blue-700 underline" href="/forgot">Request a new link</Link>.</p>
      </Page>
    );
  return (
    <Page title="Choose a new password">
      <form action={resetPassword} className="max-w-sm space-y-4">
        <Alert>{error}</Alert>
        <input type="hidden" name="token" value={token} />
        <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={10} required hint="At least 10 characters." />
        <Button type="submit">Save password</Button>
      </form>
    </Page>
  );
}
