import Link from "next/link";
import { Alert, Button, Field, messages } from "@/components/ui";
import { signUp } from "../actions";
import { AuthCard } from "../card";

export default async function SignUp({ searchParams }: PageProps<"/sign-up">) {
  const { error } = await messages(searchParams);
  return (
    <AuthCard title="Create your account" description="Free for students. No university account needed."
      footer={<>Already have an account?&nbsp;<Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-in">Sign in</Link></>}>
      <form action={signUp} className="grid gap-4">
        <Alert>{error}</Alert>
        <Field label="Name" name="name" autoComplete="name" required />
        <Field label="Email" name="email" type="email" autoComplete="email" required
          hint="A personal address works best. You keep your account after you leave a university." />
        <Field label="Password" name="password" type="password" autoComplete="new-password" minLength={10} required hint="At least 10 characters." />
        <Button type="submit" className="w-full">Create account</Button>
      </form>
    </AuthCard>
  );
}
