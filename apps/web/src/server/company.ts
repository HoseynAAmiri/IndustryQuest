import { and, eq, inArray, sql } from "drizzle-orm";
import { briefSchema } from "@iq/core";
import { enrollments, memberships, mentorProfiles, organizations, projects, user, type Db } from "@iq/db";
import { assertOrgRole, type Actor } from "./authz";
import { openCase } from "./cases";
import { Forbidden, UserError } from "./errors";
import { audit, notify, notifyAll, staffIds } from "./notify";
import { saveDraft } from "./projects";

// ACC-02, ORG-06: a company signs up unverified and can describe a challenge for staff to help shape.
export async function registerCompany(db: Db, actor: Actor, input: { name: string; description: string; challenge: string }) {
  const name = input.name.trim();
  if (name.length < 2) throw new UserError("Add the organization's name.");
  const [org] = await db.insert(organizations).values({ name: name.slice(0, 120), description: input.description.trim().slice(0, 1000) }).returning();
  await db.insert(memberships).values({ userId: actor.id, orgId: org.id, role: "owner" });
  await audit(db, actor.id, "organization_registered", "organization", org.id);
  await notifyAll(db, await staffIds(db), { kind: "staff", title: `New organization to verify: ${org.name}`, href: "/staff", key: `org-new:${org.id}` });
  const challenge = input.challenge.trim();
  if (challenge.length >= 20) {
    await saveDraft(db, actor, { orgId: org.id, brief: briefSchema.parse({
      title: "", summary: "", problem: challenge.slice(0, 4000), tier: "Q1", beginner: true, effortHours: 0, capacity: 0, mentorId: "",
      backupContact: "", compensation: "", compensationDetails: "", applyDeadline: "", deliverables: [], milestones: [], resources: "",
      terms: "", skillIds: [], prerequisites: [], rubric: [],
    }) });
    await openCase(db, actor, { type: "support", summary: `Project intake from ${org.name}: please help turn this challenge into a learning brief.\n\n${challenge}` });
  }
  return org.id;
}

// ORG-02: owners add colleagues who already have an account; no shared logins.
export async function addMember(db: Db, actor: Actor, input: { orgId: string; email: string; role: "owner" | "mentor" }) {
  await assertOrgRole(db, actor, input.orgId, "owner");
  if (input.role !== "owner" && input.role !== "mentor") throw new UserError("Choose a role.");
  const [u] = await db.select().from(user).where(eq(user.email, input.email.trim().toLowerCase()));
  if (!u) throw new UserError("No account uses that email yet. Ask them to create one, then add them.");
  await db.insert(memberships).values({ userId: u.id, orgId: input.orgId, role: input.role }).onConflictDoNothing();
  if (input.role === "mentor") await db.insert(mentorProfiles).values({ userId: u.id }).onConflictDoNothing();
  await audit(db, actor.id, "member_added", "organization", input.orgId, undefined, { userId: u.id, role: input.role });
  const [org] = await db.select({ name: organizations.name }).from(organizations).where(eq(organizations.id, input.orgId));
  await notify(db, { userId: u.id, kind: "org", essential: true, title: `You were added to ${org.name} as ${input.role === "owner" ? "an owner" : "a mentor"}`,
    href: input.role === "owner" ? "/company" : "/mentor", key: `member:${input.orgId}:${u.id}:${input.role}` });
}

// Removing access never deletes the person's account or anyone's work (§14.2).
export async function removeMember(db: Db, actor: Actor, input: { orgId: string; userId: string; role: "owner" | "mentor" }) {
  await assertOrgRole(db, actor, input.orgId, "owner");
  if (input.role === "owner") {
    const owners = await db.select().from(memberships).where(and(eq(memberships.orgId, input.orgId), eq(memberships.role, "owner")));
    if (owners.length <= 1) throw new UserError("An organization needs at least one owner.");
    const [owns] = await db.select({ n: sql<number>`count(*)::int` }).from(projects).where(and(eq(projects.orgId, input.orgId), eq(projects.ownerId, input.userId)));
    if (owns.n) throw new UserError("Transfer their projects to another owner first.");
  } else {
    const [busy] = await db.select({ n: sql<number>`count(*)::int` }).from(enrollments).innerJoin(projects, eq(projects.id, enrollments.projectId))
      .where(and(eq(projects.orgId, input.orgId), eq(enrollments.mentorId, input.userId), inArray(enrollments.state, ["active", "submitted", "revision_requested"])));
    if (busy.n) throw new UserError("They still mentor active students. Ask program staff to reassign them first.");
  }
  await db.delete(memberships).where(and(eq(memberships.orgId, input.orgId), eq(memberships.userId, input.userId), eq(memberships.role, input.role)));
  await audit(db, actor.id, "member_removed", "organization", input.orgId, undefined, { userId: input.userId, role: input.role });
}

// ORG-04: when an owner leaves, their projects move to a colleague without losing history.
export async function transferProject(db: Db, actor: Actor, input: { projectId: string; newOwnerId: string }) {
  const [p] = await db.select().from(projects).where(eq(projects.id, input.projectId));
  if (!p) throw new Forbidden();
  await assertOrgRole(db, actor, p.orgId, "owner");
  await assertOrgRole(db, { id: input.newOwnerId }, p.orgId, "owner").catch(() => { throw new UserError("The new owner must be an owner in this organization."); });
  await db.update(projects).set({ ownerId: input.newOwnerId, updatedAt: new Date() }).where(eq(projects.id, p.id));
  await audit(db, actor.id, "project_transferred", "project", p.id, undefined, { from: p.ownerId, to: input.newOwnerId });
}
