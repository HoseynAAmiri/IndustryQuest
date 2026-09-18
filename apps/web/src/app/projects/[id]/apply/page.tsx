import { notFound, redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { ShieldCheck } from "lucide-react";
import { studentProfiles } from "@iq/db";
import { COMP } from "@/components/brief-view";
import { Alert, Button, Page, TextArea, messages } from "@/components/ui";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { loadProject } from "@/server/projects";
import { applyAction } from "../actions";

export default async function Apply({ params, searchParams }: PageProps<"/projects/[id]/apply">) {
  const me = await requireUser();
  const { id } = await params;
  const { error } = await messages(searchParams);
  const db = getDb();
  const [profile] = await db.select().from(studentProfiles).where(eq(studentProfiles.userId, me.id));
  if (!profile) redirect("/onboarding");
  const row = await loadProject(db, id).catch(() => null);
  if (!row || row.project.state !== "published") notFound();
  const b = row.brief.content;
  return (
    <Page narrow title="Apply" description={b.title} back={{ href: `/projects/${id}`, label: "Back to the brief" }}>
      <Card>
        <form action={applyAction}>
          <CardHeader>
            <CardTitle>A short note is enough</CardTitle>
            <CardDescription>
              {row.org.name} picks students by the criteria in the brief. Nobody asks you for unpaid trial work.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-5 pt-4">
            <Alert>{error}</Alert>
            <input type="hidden" name="projectId" value={id} />
            <TextArea label="Why this project?" name="motivation" required minLength={20} rows={5}
              hint="What you want to learn, and any coursework or experience that relates. 2 to 5 sentences." />
            <TextArea label="When can you work on it?" name="availability" rows={2} defaultValue={`About ${profile.weeklyHours} hours a week, ${profile.timezone}.`} />
            <dl className="grid grid-cols-2 gap-3 rounded-lg bg-muted/50 p-3 text-sm">
              <div><dt className="text-muted-foreground">Effort</dt><dd>About {b.effortHours} hours</dd></div>
              <div><dt className="text-muted-foreground">Compensation</dt><dd>{COMP[b.compensation]}</dd></div>
            </dl>
          </CardContent>
          <CardFooter className="mt-4 flex-col items-stretch gap-3">
            <Button type="submit">Send application</Button>
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" /> If you're not selected, nothing appears on your profile and you lose no XP.
            </p>
          </CardFooter>
        </form>
      </Card>
    </Page>
  );
}
