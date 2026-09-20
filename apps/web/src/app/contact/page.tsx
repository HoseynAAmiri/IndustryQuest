import type { Metadata } from "next";
import { Page } from "@/components/ui";

export const metadata: Metadata = { title: "Contact us" };

export default function Contact() {
  return (
    <Page title="Contact us" description="How to reach the pilot team.">
      <div className="grid max-w-2xl gap-4 text-muted-foreground">
        <p>For questions about the pilot, write to <a className="font-medium text-primary underline-offset-4 hover:underline" href="mailto:hello@industryquest.example">hello@industryquest.example</a>.</p>
        <p>If you already have an account, use Support from the signed-in menu so we can see which project it is about.</p>
      </div>
    </Page>
  );
}
