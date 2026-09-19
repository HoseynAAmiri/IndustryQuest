import { Alert, Button, CheckField, Field, messages } from "@/components/ui";
import { AuthCard } from "../card";
import { verifyTwoFactor } from "../actions";

export default async function TwoFactor({ searchParams }: PageProps<"/two-factor">) {
  const { error } = await messages(searchParams);
  return <AuthCard title="Check your email" description="Enter the six-digit code we sent. It expires in five minutes.">
    <form action={verifyTwoFactor} className="grid gap-4"><Alert>{error}</Alert>
      <Field label="Sign-in code" name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" required />
      <CheckField name="trustDevice" label="Trust this device for 30 days" />
      <Button>Finish signing in</Button>
    </form>
  </AuthCard>;
}
