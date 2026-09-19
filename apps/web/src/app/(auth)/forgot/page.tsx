import Link from "next/link";
import { Alert, Button, Field, messages } from "@/components/ui";
import { forgotPassword } from "../actions";
import { AuthCard } from "../card";

export default async function Forgot({ searchParams }: PageProps<"/forgot">) {
  const { info } = await messages(searchParams);
  return (
    <AuthCard title="Reset your password" description="We'll email you a link to choose a new one."
      footer={<Link className="font-medium text-primary underline-offset-4 hover:underline" href="/sign-in">Back to sign in</Link>}>
      <form action={forgotPassword} className="grid gap-4">
        
        <Field label="Email" name="email" type="email" autoComplete="email" required />
        <Button type="submit" className="w-full">Send reset link</Button>
      </form>
    </AuthCard>
  );
}
