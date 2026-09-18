import Link from "next/link";
import { Alert, Button, Field, Page, messages } from "@/components/ui";
import { signUp } from "../actions";

export default async function SignUp({ searchParams }: PageProps<"/sign-up">) {
  const { error } = await messages(searchParams);
  return (
    <Page title="Create your account">
      <form action={signUp} className="max-w-sm space-y-4">
        <Alert>{error}</Alert>
        <Field label="Name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required
          hint="Use a personal address. You keep your account after you leave a university." />
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={10} required hint="At least 10 characters." />
        <Button type="submit">Create account</Button>
        <p className="text-sm">Already have an account? <Link className="text-blue-700 underline" href="/sign-in">Sign in</Link></p>
      </form>
    </Page>
  );
}
