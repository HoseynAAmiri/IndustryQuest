import { MailCheck } from "lucide-react";
import { AuthCard } from "../card";

export default async function CheckEmail({ searchParams }: PageProps<"/check-email">) {
  const { email, resent } = await searchParams;
  return (
    <AuthCard title="Check your email">
      <div role="status" className="grid gap-3 text-sm">
        <MailCheck className="size-10 text-primary" aria-hidden />
        <p>
          {resent ? "Your email isn't confirmed yet. We sent a new link" : "We sent a confirmation link"} to{" "}
          <strong className="font-medium">{email}</strong>. Open it to finish setting up your account.
        </p>
        <p className="text-muted-foreground">The link works once. If it expired, sign in again and we'll send another.</p>
      </div>
    </AuthCard>
  );
}
