import type { Metadata } from "next";
import { and, eq, inArray } from "drizzle-orm";
import { briefVersions, memberships, organizations, projects, user } from "@iq/db";
import { ConfirmForm } from "@/components/confirm";
import { Alert, Button, Field, Page, SelectField, messages } from "@/components/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/server/auth";
import { getRoles } from "@/server/authz";
import { getDb } from "@/server/db";
import { addMemberAction, removeMemberAction, transferAction } from "../actions";

export const metadata: Metadata = { title: "Team" };

// ORG-02/04: colleagues get their own accounts; projects move with their history when someone leaves.
export default async function Team({ searchParams }: PageProps<"/company/team">) {
  const me = await requireUser();
  const db = getDb();
  const { ownerOf } = await getRoles(db, me.id);
  if (!ownerOf.length) return <Page title="Team"><Alert>You aren't an owner in any organization.</Alert></Page>;
  const { error } = await messages(searchParams);
  const orgs = await db.select().from(organizations).where(inArray(organizations.id, ownerOf));
  const members = await db.select({ m: memberships, name: user.name, email: user.email }).from(memberships).innerJoin(user, eq(user.id, memberships.userId))
    .where(inArray(memberships.orgId, ownerOf));
  const owned = await db.select({ p: projects, title: briefVersions.title }).from(projects).innerJoin(briefVersions, eq(briefVersions.id, projects.currentVersionId))
    .where(inArray(projects.orgId, ownerOf));
  return (
    <Page title="Team" description="Owners write briefs and choose applicants. Mentors support and assess students." back={{ href: "/company", label: "Company projects" }}>
      <div className="mb-6"><Alert>{error}</Alert></div>
      <div className="grid gap-6">
        {orgs.map((org) => {
          const people = members.filter((x) => x.m.orgId === org.id);
          const owners = people.filter((x) => x.m.role === "owner");
          return (
            <Card key={org.id}>
              <CardHeader><CardTitle>{org.name}</CardTitle><CardDescription>{people.length} {people.length === 1 ? "person" : "people"}</CardDescription></CardHeader>
              <CardContent className="grid gap-6 lg:grid-cols-2">
                <ul className="divide-y rounded-lg border">
                  {people.map((x) => (
                    <li key={`${x.m.userId}-${x.m.role}`} className="flex flex-wrap items-center gap-2 p-3 text-sm">
                      <span className="flex-1"><span className="block font-medium">{x.name}{x.m.userId === me.id && " (you)"}</span><span className="text-muted-foreground">{x.email}</span></span>
                      <Badge variant={x.m.role === "owner" ? "default" : "secondary"}>{x.m.role}</Badge>
                      {x.m.userId !== me.id && (
                        <ConfirmForm action={removeMemberAction} fields={{ orgId: org.id, userId: x.m.userId, role: x.m.role }} size="sm" variant="ghost"
                          ask={{ title: `Remove ${x.name} as ${x.m.role}?`, description: "They lose access to this organization's projects. Their account and past work stay.", confirm: "Remove", destructive: true }}>
                          Remove
                        </ConfirmForm>
                      )}
                    </li>
                  ))}
                </ul>
                <div className="grid h-fit gap-6">
                  <form action={addMemberAction} className="grid gap-3 rounded-lg border p-4">
                    <p className="font-medium">Add a colleague</p>
                    <input type="hidden" name="orgId" value={org.id} />
                    <Field label="Their email" name="email" type="email" required hint="They need an IndustryQuest account already. Nobody shares logins." />
                    <SelectField label="Role" name="role" defaultValue="mentor" options={[{ value: "mentor", label: "Mentor" }, { value: "owner", label: "Owner" }]} />
                    <Button size="sm" className="justify-self-start">Add</Button>
                  </form>
                  {owners.length > 1 && (
                    <form action={transferAction} className="grid gap-3 rounded-lg border p-4">
                      <p className="font-medium">Hand over a project</p>
                      <SelectField label="Project" name="projectId" placeholder="Choose" options={owned.filter((o) => o.p.orgId === org.id).map((o) => ({ value: o.p.id, label: o.title || "Untitled draft" }))} />
                      <SelectField label="New owner" name="newOwnerId" placeholder="Choose" options={owners.map((o) => ({ value: o.m.userId, label: o.name }))} />
                      <Button size="sm" variant="secondary" className="justify-self-start">Transfer</Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </Page>
  );
}
