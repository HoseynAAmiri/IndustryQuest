import Link from "next/link";
import { ArrowRight, FlaskConical } from "lucide-react";
import { DEMO_PERSONAS } from "@iq/db";
import { Alert, Button, Field, messages } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { isDemo } from "@/server/demo";
import { demoSignIn, signIn } from "../actions";
import { AuthCard } from "../card";

export default async function SignIn({ searchParams }: PageProps<"/sign-in">) {
  const { error, info } = await messages(searchParams);
  return (
    <div className="grid w-full max-w-4xl items-start gap-6 md:grid-cols-[minmax(0,24rem)_1fr]">
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
      {isDemo() && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FlaskConical className="size-5 text-primary" /> Try a demo persona</CardTitle>
            <CardDescription>Every company, person and result is fictional. Pick someone to see the product from their side.</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid gap-2">
              {DEMO_PERSONAS.map((p) => (
                <li key={p.email}>
                  <form action={demoSignIn}>
                    <input type="hidden" name="email" value={p.email} />
                    <button className="press group flex w-full items-center gap-3 rounded-lg border p-3 text-left hover:border-primary/50 hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring">
                      <span className="flex-1">
                        <span className="flex flex-wrap items-center gap-2 font-medium">{p.name} <Badge variant="outline">{p.role}</Badge></span>
                        <span className="text-sm text-muted-foreground">{p.shows}</span>
                      </span>
                      <ArrowRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                    </button>
                  </form>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
