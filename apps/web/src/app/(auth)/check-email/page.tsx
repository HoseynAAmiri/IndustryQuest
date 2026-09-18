import { Page } from "@/components/ui";

export default async function CheckEmail({ searchParams }: PageProps<"/check-email">) {
  const { email, resent } = await searchParams;
  return (
    <Page title="Check your email">
      <p role="status">
        {resent ? "Your email isn't confirmed yet. We sent a new link" : "We sent a confirmation link"} to{" "}
        <strong>{email}</strong>. Open it to finish setting up your account.
      </p>
      <p className="mt-4 text-sm text-slate-600">The link works once. If it expired, sign in again and we'll send another.</p>
    </Page>
  );
}
