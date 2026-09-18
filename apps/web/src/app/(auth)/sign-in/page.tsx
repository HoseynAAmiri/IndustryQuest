import Link from "next/link";
import { Alert, Button, Field, messages } from "@/components/ui";
import { signIn } from "../actions";
import { AuthCard } from "../card";

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { error, info } = await messages(searchParams);
  return (
    <AuthCard title="Sign in" description="Welcome back."
      footer={<>New here?&nbsp;<Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-up">Create an account</Link></>}>
      <form action={signIn} className="grid gap-4">
        <Alert>{error}</Alert>
        <Alert tone="info">{info}</Alert>
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <div className="grid gap-1.5">
          <Field label="Password" name="password" type="password" autoComplete="current-password" required />
          <Link href="/forgot" className="justify-self-end text-sm text-muted-foreground underline-offset-4 hover:underline">Forgot your password?</Link>
        </div>
        <Button type="submit" className="w-full">Sign in</Button>
      </form>
    </AuthCard>
  );
}
