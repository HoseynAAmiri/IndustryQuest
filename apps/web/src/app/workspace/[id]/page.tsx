import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import {
  CalendarClock, CheckCircle2, Circle, ClipboardCheck, Download, ExternalLink, FileText, LifeBuoy, Link2, MessageSquare, PartyPopper, Send, Upload,
} from "lucide-react";
import { briefVersions, skills, studentProfiles } from "@iq/db";
import { briefDiff, briefSchema } from "@iq/core";
import { ConfirmSubmit } from "@/components/confirm";
import { BriefView } from "@/components/brief-view";
import { Alert, Button, CheckField, EnrollmentBadge, Field, Page, SelectField, TextArea, messages, when } from "@/components/ui";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { requireUser } from "@/server/auth";
import { getDb } from "@/server/db";
import { issueRewards } from "@/server/rewards";
import { loadWorkspace } from "@/server/workspace";
import { openCaseAction } from "@/app/support/actions";
import { draftAction, linkAction, messageAction, milestoneAction, scopeAction, submitAction } from "./actions";
import { UnsavedGuard } from "@/components/unsaved-guard";

export const metadata: Metadata = { title: "Workspace" };

const initials = (n: string) => n.split(" ").map((p) => p[0]).slice(0, 2).join("");
const size = (n: number | null) => (n == null ? "" : n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.ceil(n / 1e3)} KB`);
const DECISION = { accept: "Accepted", revise: "Revision requested", not_complete: "Not completed" } as const;

// WRK-04: highlight @mentions in message text.
const withMentions = (text: string) =>
  text.split(/(@[A-Z][\p{L}-]+(?: [A-Z][\p{L}-]+)?)/u).map((part, i) => (part.startsWith("@") ? <strong key={i} className="text-primary">{part}</strong> : part));

export default async function Workspace({ params, searchParams }: PageProps<"/workspace/[id]">) {
  const me = await requireUser();
  const { id } = await params;
  const { error, info } = await messages(searchParams);
  const tab = String((await searchParams).tab ?? "overview");
  const db = getDb();
  let w = await loadWorkspace(db, me, id).catch(() => null);
  if (!w) notFound(); // same response for "missing" and "not yours" (AC-08)
  if (w.e.rewardsStatus === "pending") {
    await issueRewards(db, id).catch((err) => console.error("issueRewards retry failed", id, err));
    w = (await loadWorkspace(db, me, id))!;
  }
  const [profile] = await db.select({ tz: studentProfiles.timezone }).from(studentProfiles).where(eq(studentProfiles.userId, w.e.studentId));
  const tz = profile?.tz ?? "UTC";
  const names = Object.fromEntries((await db.select().from(skills)).map((s) => [s.id, s.name]));
  const isStudent = w.access === "student";
  const canSubmit = isStudent && (w.e.state === "active" || w.e.state === "revision_requested");
  const lastReview = w.submissions.find((s) => s.a)?.a;
  const done = w.milestones.filter((m) => m.doneAt).length;
  const [proposed] = w.e.proposedVersionId ? await db.select().from(briefVersions).where(eq(briefVersions.id, w.e.proposedVersionId)) : [];
  const changes = proposed ? briefDiff(briefSchema.parse(w.v.content), briefSchema.parse(proposed.content)) : [];
  const decided = w.e.state === "closed_incomplete" || w.e.state === "completed";
  const fileName = Object.fromEntries(w.files.map(({ f }) => [f.id, f.name]));

  const timeline = [
    { at: w.e.createdAt, text: "Applied" },
    w.e.acceptedAt && { at: w.e.acceptedAt, text: `Accepted brief version ${w.v.version}; ${w.mentor?.name ?? "mentor"} assigned` },
    ...w.milestones.filter((m) => m.doneAt).map((m) => ({ at: m.doneAt!, text: `Milestone done: ${m.title}` })),
    ...w.submissions.map(({ s }) => ({ at: s.createdAt, text: `Submitted version ${s.version}` })),
    ...w.submissions.filter((x) => x.a).map(({ a, assessor }) => ({ at: a!.createdAt, text: `${DECISION[a!.decision]} by ${assessor}` })),
  ].filter((x): x is { at: Date; text: string } => !!x).sort((a, b) => b.at.getTime() - a.at.getTime());

  return (
    <Page title={w.v.title} description={`${w.org.name} · ${w.student.name}`}
      back={isStudent ? { href: "/quests", label: "My quests" } : w.access === "mentor" ? { href: "/mentor", label: "Review queue" } : { href: "/company", label: "Company projects" }}
      actions={<EnrollmentBadge state={w.e.state} />}>
      <div className="mb-6 grid gap-3">
        <Alert>{error}</Alert>
        
        {proposed && (
          <Card className="border-primary/50 bg-primary/5">
            <form action={scopeAction} id="scope">
              <CardHeader>
                <CardTitle className="text-base">{w.org.name} proposes a change to the brief (version {proposed.version})</CardTitle>
                <CardDescription>{w.e.proposalReason}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 pt-4 text-sm">
                <input type="hidden" name="enrollmentId" value={id} />
                <p><span className="font-medium">What changes:</span> {changes.join(", ") || "wording only"}.</p>
                <p className="text-muted-foreground">
                  You agreed to version {w.v.version}. Nothing changes unless you accept. If you decline, you keep the original scope, rubric and reward.
                </p>
                {isStudent ? (
                  <div className="flex flex-wrap gap-2">
                    <Button name="decision" value="accept" size="sm">Accept the new version</Button>
                    <ConfirmSubmit formId="scope" name="decision" value="decline" size="sm" variant="outline"
                      ask={{ title: "Keep your original agreement?", description: "The company is told you declined. If the project can't continue as agreed, program staff help find a fair outcome.", confirm: "Keep original" }}>
                      Keep my original agreement
                    </ConfirmSubmit>
                  </div>
                ) : <p className="font-medium">Waiting for the student to decide.</p>}
              </CardContent>
            </form>
          </Card>
        )}
        {w.e.state === "revision_requested" && lastReview && (
          <Card className="border-amber-500/50 bg-amber-50/60 dark:bg-amber-950/20">
            <CardHeader>
              <CardTitle className="text-base">Revision requested by {w.mentor?.name}</CardTitle>
              <CardDescription>Due {when(lastReview.revisionDueAt, tz, true)}. Earlier versions and feedback stay in the history.</CardDescription>
            </CardHeader>
            <CardContent className="whitespace-pre-line text-sm">{lastReview.comment}</CardContent>
          </Card>
        )}
        {w.e.state === "completed" && (
          <Card className="border-green-600/40 bg-green-50/60 dark:bg-green-950/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base"><PartyPopper className="size-5 text-green-700 motion-safe:animate-in motion-safe:zoom-in-50 motion-safe:spin-in-12 motion-safe:duration-700" /> Accepted on {when(w.e.completedAt, tz)}</CardTitle>
              <CardDescription>
                {w.e.rewardsStatus === "issued"
                  ? `You earned ${w.v.xp} XP and a verified completion record.`
                  : "Review accepted. Credentials are being issued; refresh in a moment."}
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              Closeout: your accepted version, feedback and credentials are kept for good. Company files move to read-only for the project team.
              You can show what your portfolio rules allow{w.v.content.portfolioRules ? `: ${w.v.content.portfolioRules}` : "."}
            </CardContent>
            {isStudent && w.e.rewardsStatus === "issued" && (
              <CardContent className="flex flex-wrap gap-2">
                <Button asChild size="sm"><Link href="/profile?tab=credentials">See your XP and credentials</Link></Button>
                <Button asChild size="sm" variant="outline"><Link href="/explore">Find your next quest</Link></Button>
              </CardContent>
            )}
          </Card>
        )}
        {w.access === "mentor" && w.e.state === "submitted" && (
          <Alert tone="info">
            A new version is waiting for your review.{" "}
            <Link className="font-medium underline" href={`/mentor/review/${w.submissions[0].s.id}`}>Review it now</Link>
          </Alert>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <Tabs defaultValue={["overview", "discussion", "files", "submissions", "brief"].includes(tab) ? tab : "overview"} className="min-w-0">
          <div className="-mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0"><TabsList className="w-max">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="discussion">Discussion ({w.messages.length})</TabsTrigger>
            <TabsTrigger value="files">Files ({w.files.length})</TabsTrigger>
            <TabsTrigger value="submissions">Submissions ({w.submissions.length})</TabsTrigger>
            <TabsTrigger value="brief">Accepted brief</TabsTrigger>
          </TabsList></div>

          <TabsContent value="overview" className="mt-4 grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Milestones</CardTitle>
                <CardDescription>{done} of {w.milestones.length} done · dates in {tz}</CardDescription>
              </CardHeader>
              <CardContent>
                <ol className="grid gap-2">
                  {w.milestones.map((m) => (
                    <li key={m.id} className="flex items-center gap-3 rounded-lg border p-3">
                      {isStudent && canSubmit ? (
                        <form action={milestoneAction}>
                          <input type="hidden" name="enrollmentId" value={id} />
                          <input type="hidden" name="milestoneId" value={m.id} />
                          <Button variant="ghost" size="icon-sm" aria-label={m.doneAt ? `Mark “${m.title}” not done` : `Mark “${m.title}” done`}>
                            {m.doneAt ? <CheckCircle2 className="text-green-600" /> : <Circle />}
                          </Button>
                        </form>
                      ) : m.doneAt ? <CheckCircle2 className="size-5 text-green-600" aria-label="Done" /> : <Circle className="size-5 text-muted-foreground" aria-label="Not done" />}
                      <span className={`flex-1 ${m.doneAt ? "text-muted-foreground line-through" : ""}`}>{m.title}</span>
                      <span className="flex items-center gap-1 text-sm text-muted-foreground"><CalendarClock className="size-3.5" />{when(m.dueAt, tz)}</span>
                    </li>
                  ))}
                  {!w.milestones.length && <li className="text-muted-foreground">Milestones appear once the offer is accepted.</li>}
                </ol>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Activity</CardTitle><CardDescription>Everything that changed on this project.</CardDescription></CardHeader>
              <CardContent>
                <ol className="relative grid gap-4 border-l pl-5">
                  {timeline.map((t, i) => (
                    <li key={i} className="relative text-sm">
                      <span className="absolute -left-[1.6rem] top-1 size-2.5 rounded-full bg-primary" aria-hidden />
                      <span className="font-medium">{t.text}</span>
                      <span className="block text-muted-foreground">{when(t.at, tz, true)}</span>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="discussion" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" /> Project discussion</CardTitle>
                <CardDescription>Visible to you, your mentor and the company owner. For private problems use the support box instead.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ol className="grid gap-4">
                  {w.messages.map(({ m, author }) => (
                    <li key={m.id} className="flex gap-3">
                      <Avatar className="size-8"><AvatarFallback className="text-xs">{initials(author)}</AvatarFallback></Avatar>
                      <div className="grid gap-1">
                        <p className="text-sm"><span className="font-medium">{author}</span> <span className="text-muted-foreground">· {when(m.createdAt, tz, true)}</span></p>
                        <p className="whitespace-pre-line text-sm">{withMentions(m.body)}</p>
                        {m.fileId && fileName[m.fileId] && <a href={`/api/files/${m.fileId}`} className="text-sm text-primary underline-offset-4 hover:underline">Attached: {fileName[m.fileId]}</a>}
                        {m.isQuestion && (m.answeredAt
                          ? <Badge variant="outline" className="justify-self-start">Question · answered</Badge>
                          : <Badge variant="secondary" className="justify-self-start">Question · waiting for a reply</Badge>)}
                      </div>
                    </li>
                  ))}
                  {!w.messages.length && <li className="text-sm text-muted-foreground">No messages yet. Questions are welcome; your mentor expects them.</li>}
                </ol>
                <form action={messageAction} className="grid gap-2 border-t pt-4">
                  <input type="hidden" name="enrollmentId" value={id} />
                  <Label htmlFor="body">New message</Label>
                  <textarea id="body" name="body" rows={3} required className="rounded-md border bg-background p-2 text-sm"
                    placeholder={`Type @${w.mentor?.name.split(" ")[0] ?? "Name"} to mention someone`} />
                  <div className="flex flex-wrap items-end gap-3">
                    <CheckField name="isQuestion" label="This is a question" />
                    {w.files.length > 0 && (
                      <div className="min-w-48"><SelectField label="Attach a project file" name="fileId" placeholder="No attachment"
                        options={[{ value: "none", label: "No attachment" }, ...w.files.map(({ f }) => ({ value: f.id, label: f.name }))]} /></div>
                    )}
                    <UnsavedGuard />
                    <Button className="ml-auto" size="sm"><Send /> Post</Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="files" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Files and links</CardTitle>
                <CardDescription>Only people on this project can open them. Up to 10 MB per file.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4">
                <ul className="divide-y rounded-lg border">
                  {w.files.map(({ f, by }) => {
                    const same = w.files.filter((x) => x.f.name === f.name);
                    const version = same.length - same.findIndex((x) => x.f.id === f.id);
                    return (
                    <li key={f.id} className="flex items-center gap-3 p-3 text-sm">
                      {f.url ? <Link2 className="size-4 text-muted-foreground" /> : <FileText className="size-4 text-muted-foreground" />}
                      <span className="flex-1">
                        <span className="block font-medium">{f.name}{same.length > 1 && <Badge variant="outline" className="ml-2">v{version}{version === same.length && " · latest"}</Badge>}</span>
                        {f.description && <span className="block">{f.description}</span>}
                        <span className="text-muted-foreground">{by} · {when(f.createdAt, tz)} {f.size ? `· ${size(f.size)}` : "· external link"}{f.sha256 && ` · sha256 ${f.sha256.slice(0, 8)}`}</span>
                      </span>
                      <Button asChild variant="ghost" size="icon-sm" aria-label={`Open ${f.name}`}>
                        <a href={`/api/files/${f.id}`}>{f.url ? <ExternalLink /> : <Download />}</a>
                      </Button>
                    </li>
                    );
                  })}
                  {!w.files.length && <li className="p-4 text-sm text-muted-foreground">No files yet.</li>}
                </ul>
                {isStudent && canSubmit && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <form action="/api/files" method="post" encType="multipart/form-data" className="grid gap-2 rounded-lg border p-3">
                      <input type="hidden" name="enrollmentId" value={id} />
                      <Label htmlFor="file">Upload a file</Label>
                      <Input id="file" name="file" type="file" required />
                      <Input name="description" placeholder="What is it? (optional)" aria-label="File description" />
                      <p className="text-xs text-muted-foreground">Uploading a file with the same name adds a new version; earlier ones stay.</p>
                      <Button size="sm" variant="secondary"><Upload /> Upload</Button>
                    </form>
                    <form action={linkAction} className="grid gap-2 rounded-lg border p-3">
                      <input type="hidden" name="enrollmentId" value={id} />
                      <Field label="Link name" name="name" placeholder="Analysis notebook" />
                      <Field label="URL" name="url" type="url" required placeholder="https://" />
                      <Field label="Description (optional)" name="description" />
                      <Button size="sm" variant="secondary"><Link2 /> Add link</Button>
                    </form>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="submissions" className="mt-4 grid gap-4">
            {canSubmit && (
              <Card id="submit" className="border-primary/40">
                <form action={submitAction}>
                  <CardHeader>
                    <CardTitle className="text-base">{w.e.state === "revision_requested" ? "Submit your revision" : "Submit your work"}</CardTitle>
                    <CardDescription>Your mentor scores it against the rubric you accepted. Earlier versions are kept.</CardDescription>
                  </CardHeader>
                  <CardContent className="grid gap-4 pt-4">
                    <input type="hidden" name="enrollmentId" value={id} />
                    <input type="hidden" name="clientKey" value={crypto.randomUUID()} />
                    <fieldset className="grid gap-2">
                      <legend className="mb-1 text-sm font-medium">Evidence</legend>
                      {w.files.map(({ f }) => <CheckField key={f.id} name="fileIds" value={f.id} label={f.name} defaultChecked />)}
                      {!w.files.length && <p className="text-sm text-muted-foreground">Add a file or link on the Files tab first.</p>}
                    </fieldset>
                    <TextArea label="What you did" name="contribution" required minLength={20} defaultValue={w.e.draftContribution ?? ""}
                      hint="Your contribution in your own words. It appears on your verified record." />
                    <TextArea label="Reflection (private)" name="reflection" rows={3} defaultValue={w.e.draftReflection ?? ""} hint="What you learned. Only you and your mentor see it." />
                    <div className="flex flex-wrap items-center gap-2">
                      <Button>Submit for review</Button>
                      <Button formAction={draftAction} formNoValidate variant="outline">Save draft</Button>
                      <UnsavedGuard />
                    </div>
                  </CardContent>
                </form>
              </Card>
            )}
            {w.submissions.map(({ s, a, assessor }) => (
              <Card key={s.id}>
                <CardHeader>
                  <CardTitle className="text-base">Version {s.version}</CardTitle>
                  <CardDescription>Submitted {when(s.createdAt, tz, true)}</CardDescription>
                  {a && <Badge variant={a.decision === "accept" ? "default" : "secondary"} className="justify-self-end">{DECISION[a.decision]}</Badge>}
                </CardHeader>
                <CardContent className="grid gap-4 text-sm">
                  <p className="whitespace-pre-line">{s.contributionStatement}</p>
                  <p className="text-muted-foreground">Evidence: {s.fileIds.map((f) => fileName[f] ?? "file").join(", ")}</p>
                  {s.reflection && (isStudent || w.access === "mentor") && <p className="rounded-lg bg-muted/50 p-3"><span className="font-medium">Reflection:</span> {s.reflection}</p>}
                  {a ? (
                    <div className="grid gap-2 rounded-lg border p-3">
                      <p className="font-medium">Feedback from {assessor}</p>
                      <ul className="grid gap-1">
                        {w.v.content.rubric.map((c) => {
                          const sc = a.scores.find((x) => x.criterionId === c.id);
                          return (
                            <li key={c.id} className="flex justify-between gap-2">
                              <span>{c.name}{c.skillId && <span className="text-muted-foreground"> · {names[c.skillId]}</span>}</span>
                              <span className="tabular-nums">{sc?.score == null ? "N/A" : `${sc.score} / 4`}{c.critical && sc?.score != null && sc.score < c.threshold && " ✗ below threshold"}</span>
                            </li>
                          );
                        })}
                      </ul>
                      <p className="whitespace-pre-line text-muted-foreground">{a.comment}</p>
                    </div>
                  ) : (
                    <p className="flex items-center gap-2 text-muted-foreground"><ClipboardCheck className="size-4" /> Waiting for review. The target is five business days.</p>
                  )}
                </CardContent>
              </Card>
            ))}
            {!w.submissions.length && !canSubmit && <p className="text-sm text-muted-foreground">No submissions yet.</p>}
          </TabsContent>

          <TabsContent value="brief" className="mt-4">
            <p className="mb-4 text-sm text-muted-foreground">
              Version {w.v.version}, the one accepted on {when(w.e.acceptedAt, tz)}. Later edits by the company don't change it.
            </p>
            <BriefView b={w.v.content} orgName={w.org.name} mentorName={w.mentor?.name} skillNames={names} />
          </TabsContent>
        </Tabs>

        <aside className="grid h-fit gap-4" aria-label="People and support">
          <Card>
            <CardHeader><CardTitle className="text-base">Your mentor</CardTitle></CardHeader>
            <CardContent className="grid gap-3 text-sm">
              {w.mentor ? (
                <div className="flex items-center gap-3">
                  <Avatar><AvatarFallback>{initials(w.mentor.name)}</AvatarFallback></Avatar>
                  <div><p className="font-medium">{w.mentor.name}</p><p className="text-muted-foreground">{w.org.name}</p></div>
                </div>
              ) : <p className="text-muted-foreground">Assigned when the offer is accepted.</p>}
              <p className="text-muted-foreground">Replies to questions within two business days; reviews within five.</p>
            </CardContent>
          </Card>
          {isStudent && (
            <Card>
              <form action={openCaseAction}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base"><LifeBuoy className="size-4" /> {decided ? "Disagree with the decision?" : "Stuck or worried?"}</CardTitle>
                  <CardDescription>
                    {decided ? "Appeal privately. Someone who wasn't part of the decision reviews it." : "Goes privately to program staff, not to the company or your mentor. It never counts against you."}
                  </CardDescription>
                </CardHeader>
                <CardContent className="grid gap-3 pt-4">
                  <input type="hidden" name="enrollmentId" value={id} />
                  {decided ? <input type="hidden" name="type" value="appeal" /> : (
                    <SelectField label="What's going on?" name="type" defaultValue="blocker"
                      options={[{ value: "blocker", label: "I'm blocked" }, { value: "extension", label: "I need more time" }, { value: "conduct", label: "A problem with the company or mentor" }]} />
                  )}
                  {!decided && <Field label="Extra days needed (for more time)" name="requestedDays" type="number" min={1} max={30} placeholder="7" />}
                  <TextArea label="Details" name="summary" rows={3} required minLength={10} />
                  <Button size="sm" variant="secondary" className="justify-self-start">{decided ? "Send appeal" : "Send privately"}</Button>
                  <p className="text-xs text-muted-foreground">Backup contact: {w.v.content.backupContact}</p>
                </CardContent>
              </form>
            </Card>
          )}
          <Card>
            <CardHeader><CardTitle className="text-base">Reward</CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {w.v.xp} XP on accepted completion, fixed when you accepted. Skill evidence comes from rubric scores of 3 or 4.
            </CardContent>
          </Card>
        </aside>
      </div>
    </Page>
  );
}
