import Link from "next/link";
import { Alert, Button, Field, messages } from "@/components/ui";
import { resetPassword } from "../actions";
import { AuthCard } from "../card";

export default async function Reset({ searchParams }: PageProps<"/reset">) {
  const { error } = await messages(searchParams);
  const { token } = await searchParams;
  if (typeof token !== "string" || token === "INVALID_TOKEN")
    return (
      <AuthCard title="This reset link doesn't work" description="It may have expired or been used already."
        footer={<Link className="font-medium text-primary underline-offset-4 hover:underline" href="/forgot">Request a new link</Link>}>
        <p className="text-sm text-muted-foreground">Reset links last one hour and work once.</p>
      </AuthCard>
    );
  return (
    <AuthCard title="Choose a new password">
      <form action={resetPassword} className="grid gap-4">
        <Alert>{error}</Alert>
        <input type="hidden" name="token" value={token} />
        <Field label="New password" name="password" type="password" autoComplete="new-password" minLength={10} required hint="At least 10 characters." />
        <Button type="submit" className="w-full">Save password</Button>
      </form>
    </AuthCard>
  );
}
