import { Alert, Button, Field, Page, messages } from "@/components/ui";
import { forgotPassword } from "../actions";

export default async function Forgot({ searchParams }: PageProps<"/forgot">) {
  const { info } = await messages(searchParams);
  return (
    <Page title="Reset your password" back={{ href: "/sign-in", label: "Sign in" }}>
      <form action={forgotPassword} className="max-w-sm space-y-4">
        <Alert tone="info">{info}</Alert>
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Button type="submit">Send reset link</Button>
      </form>
    </Page>
  );
}
