import Link from "next/link";
import { Alert, Button, Field, Page, messages } from "@/components/ui";
import { signIn } from "../actions";

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { error, info } = await messages(searchParams);
  return (
    <Page title="Sign in">
      <form action={signIn} className="max-w-sm space-y-4">
        <Alert>{error}</Alert>
        <Alert tone="info">{info}</Alert>
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Field label="Password" name="password" type="password" autoComplete="current-password" required />
        <Button type="submit">Sign in</Button>
        <p className="text-sm">
          <Link className="text-blue-700 underline" href="/forgot">Forgot your password?</Link>
          {" · "}
          <Link className="text-blue-700 underline" href="/sign-up">Create an account</Link>
        </p>
      </form>
    </Page>
  );
}
