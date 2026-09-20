import type { Metadata } from "next";
import { Page } from "@/components/ui";

export const metadata: Metadata = { title: "About us" };

export default function About() {
  return (
    <Page title="About us" description="What IndustryQuest is for.">
      <div className="grid max-w-2xl gap-4 text-muted-foreground">
        <p>IndustryQuest is a place to do a real, scoped project with a named mentor, then keep a record of the work that anyone can check.</p>
        <p>No prior industry experience is needed. Start with a beginner project and work up from there.</p>
      </div>
    </Page>
  );
}
