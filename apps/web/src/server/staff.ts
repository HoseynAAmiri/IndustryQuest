import { and, desc, eq, inArray, isNull, lt, sql } from "drizzle-orm";
import { criterionSchema, tierFor, tierRank } from "@iq/core";
import {
  assessments, auditEvents, briefVersions, credentials, enrollments, equivalencies, holidays, mentorProfiles, milestones, organizations, projects,
  rubricTemplates, skillEvidence, skills, studentProfiles, submissions, user, xpTransactions, type Db,
} from "@iq/db";
import { assertStaff, type Actor } from "./authz";
import { UserError } from "./errors";
import { audit, notify, notifyAll, ownersOf, staffIds } from "./notify";

// ENR-07: extra concurrent places for one student, with a documented reason.
export async function grantException(db: Db, actor: Actor, input: { userId: string; slots: number; reason: string }) {
  await assertStaff(db, actor);
  if (input.reason.trim().length < 10) throw new UserError("Record why the exception is justified.");
  const slots = Math.max(0, Math.min(3, Math.round(input.slots)));
  await db.update(studentProfiles).set({ extraActiveSlots: slots, extraSlotsReason: input.reason.trim() }).where(eq(studentProfiles.userId, input.userId));
  await audit(db, actor.id, "limit_exception", "user", input.userId, input.reason.trim(), { slots });
  await notify(db, { userId: input.userId, kind: "account", title: slots ? `You can now take ${2 + slots} projects at once` : "Your project limit is back to 2",
    href: "/quests", key: `exception:${input.userId}:${Date.now()}` });
}

// ENR-09, AC-22: record the evidence and who accepted it. No credential, no tier, no XP.
export async function grantEquivalency(db: Db, actor: Actor, input: { userId: string; skillId: string; evidence: string; caseId?: string }) {
  await assertStaff(db, actor);
  if (input.evidence.trim().length < 10) throw new UserError("Describe the evidence you accepted.");
  const [skill] = await db.select().from(skills).where(eq(skills.id, input.skillId));
  if (!skill) throw new UserError("Choose a skill.");
  const values = { evidence: input.evidence.trim(), grantedBy: actor.id, caseId: input.caseId ?? null };
  await db.insert(equivalencies).values({ userId: input.userId, skillId: skill.id, ...values })
    .onConflictDoUpdate({ target: [equivalencies.userId, equivalencies.skillId], set: values });
  await audit(db, actor.id, "equivalency_granted", "user", input.userId, input.evidence.trim(), { skillId: skill.id });
  await notify(db, { userId: input.userId, kind: "account", essential: true, title: `Equivalency accepted: ${skill.name}`,
    body: "Projects that need Emerging in this skill are open to you. It isn't a platform credential.", href: `/explore?skill=${skill.id}`, key: `equiv:${input.userId}:${skill.id}` });
}

// CRD-04, AC-15: revoking a completion reverses its XP with a linked correction, retires its skill
// evidence, and withdraws any tier credential that no longer holds. Nothing is deleted.
export async function revokeCredential(db: Db, actor: Actor, input: { credentialId: string; reason: string }) {
  await assertStaff(db, actor);
  if (input.reason.trim().length < 10) throw new UserError("Record the reason. The student reads it.");
  const [c] = await db.select().from(credentials).where(eq(credentials.id, input.credentialId));
  if (!c || c.status !== "active") throw new UserError("Only active credentials can be revoked.");
  const now = new Date();
  await db.transaction(async (tx) => {
    await tx.update(credentials).set({ status: "revoked" }).where(eq(credentials.id, c.id));
    if (c.kind !== "completion" || !c.enrollmentId) return;
    const [award] = await tx.select().from(xpTransactions).where(eq(xpTransactions.idempotencyKey, `xp:${c.enrollmentId}:base`));
    if (award) await tx.insert(xpTransactions).values({
      userId: c.userId, amount: -award.amount, kind: "correction", enrollmentId: c.enrollmentId,
      reason: `Correction: completion revoked. ${input.reason.trim()}`, idempotencyKey: `xp:${c.enrollmentId}:revoke`,
    }).onConflictDoNothing();
    const retired = await tx.update(skillEvidence).set({ revokedAt: now })
      .where(and(eq(skillEvidence.enrollmentId, c.enrollmentId), isNull(skillEvidence.revokedAt))).returning();
    for (const skillId of new Set(retired.map((r) => r.skillId))) {
      const left = await tx.select().from(skillEvidence).where(and(eq(skillEvidence.userId, c.userId), eq(skillEvidence.skillId, skillId), isNull(skillEvidence.revokedAt)));
      const tier = tierFor(left);
      const tierCreds = await tx.select().from(credentials)
        .where(and(eq(credentials.userId, c.userId), eq(credentials.skillId, skillId), eq(credentials.kind, "skill_tier"), eq(credentials.status, "active")));
      for (const t of tierCreds)
        if (tierRank(t.tier as "emerging" | "bronze") > tierRank(tier)) await tx.update(credentials).set({ status: "revoked" }).where(eq(credentials.id, t.id));
    }
    const [{ n }] = await tx.select({ n: sql<number>`count(*)::int` }).from(credentials)
      .where(and(eq(credentials.userId, c.userId), eq(credentials.kind, "completion"), eq(credentials.status, "active")));
    if (!n) await tx.update(credentials).set({ status: "revoked" })
      .where(and(eq(credentials.userId, c.userId), eq(credentials.idempotencyKey, `achievement:${c.userId}:first-quest`)));
  });
  await audit(db, actor.id, "credential_revoked", "credential", c.id, input.reason.trim());
  await notify(db, { userId: c.userId, kind: "credential", essential: true, title: `A credential was revoked: ${c.title}`,
    body: `${input.reason.trim()} You can appeal from Support.`, href: "/profile?tab=credentials", key: `revoke:${c.id}` });
}

export async function correctCredentialSummary(db: Db, actor: Actor, input: { credentialId: string; summary: string; reason: string }) {
  await assertStaff(db, actor);
  if (input.reason.trim().length < 10) throw new UserError("Record the reason for the correction.");
  const [c] = await db.update(credentials).set({ summary: input.summary.trim().slice(0, 1000) }).where(eq(credentials.id, input.credentialId)).returning();
  if (!c) throw new UserError("Credential not found.");
  await audit(db, actor.id, "credential_corrected", "credential", c.id, input.reason.trim());
  await notify(db, { userId: c.userId, kind: "credential", essential: true, title: `A credential was corrected: ${c.title}`, body: input.reason.trim(),
    href: "/profile?tab=credentials", key: `correct:${c.id}:${Date.now()}` });
}

// ACC-06: say what was checked, not just "verified".
export async function verifyMentor(db: Db, actor: Actor, input: { userId: string; note: string }) {
  await assertStaff(db, actor);
  if (input.note.trim().length < 5) throw new UserError("Say what you checked.");
  await db.update(mentorProfiles).set({ verifiedAt: new Date(), verifiedBy: actor.id, verificationNote: input.note.trim() }).where(eq(mentorProfiles.userId, input.userId));
  await audit(db, actor.id, "mentor_verified", "user", input.userId, input.note.trim());
}

const businessDaysAgo = (n: number, daysOff = new Set<string>()) => {
  const d = new Date();
  for (let left = n; left > 0;) {
    d.setDate(d.getDate() - 1);
    if (d.getDay() % 6 && !daysOff.has(d.toISOString().slice(0, 10))) left--;
  }
  return d;
};

// ASM-05, AC-13, NTF-10: late reviews go to the mentor and then to staff; overdue milestones remind the
// student. Nothing here changes a grade, state or XP. Deadlines already include approved extensions, and
// students waiting on an extension request aren't nagged.
// ponytail: runs when staff or mentors load their pages; move to a Cloudflare Cron Trigger for real use.
export async function runEscalations(db: Db) {
  const daysOff = new Set((await db.select({ day: holidays.day }).from(holidays)).map((h) => h.day));
  const lateReviews = await db.select({ s: submissions, e: enrollments, title: briefVersions.title, student: user.name }).from(submissions)
    .innerJoin(enrollments, eq(enrollments.id, submissions.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .leftJoin(assessments, eq(assessments.submissionId, submissions.id))
    .where(and(eq(enrollments.state, "submitted"), isNull(assessments.id), lt(submissions.createdAt, businessDaysAgo(5, daysOff)),
      sql`(${enrollments.pausedUntil} is null or ${enrollments.pausedUntil} <= now())`));
  for (const r of lateReviews) {
    if (r.e.mentorId) await notify(db, { userId: r.e.mentorId, kind: "review", essential: true, title: `Review past the 5-day target: ${r.student}`,
      body: "Please review, or tell program staff if you can't.", href: `/mentor/review/${r.s.id}`, key: `late-review:${r.s.id}` });
    await notifyAll(db, await staffIds(db), { kind: "staff", title: `Escalation: review overdue for ${r.student}`, body: r.title,
      href: `/staff#attention`, key: `escalate:${r.s.id}` });
  }
  const lateMilestones = await db.select({ m: milestones, e: enrollments, title: briefVersions.title, student: user.name }).from(milestones)
    .innerJoin(enrollments, eq(enrollments.id, milestones.enrollmentId))
    .innerJoin(briefVersions, eq(briefVersions.id, enrollments.briefVersionId))
    .innerJoin(user, eq(user.id, enrollments.studentId))
    .where(and(isNull(milestones.doneAt), lt(milestones.dueAt, new Date()), inArray(enrollments.state, ["active", "revision_requested"]),
      sql`(${enrollments.pausedUntil} is null or ${enrollments.pausedUntil} <= now())`,
      sql`${enrollments.id} not in (select enrollment_id from cases where type = 'extension' and status <> 'resolved' and enrollment_id is not null)`));
  for (const r of lateMilestones)
    await notify(db, { userId: r.e.studentId, kind: "milestone", title: `Milestone overdue: ${r.m.title}`,
      body: "Finish it, or ask for more time from the workspace. Asking never counts against you.", href: `/workspace/${r.e.id}`, key: `late-ms:${r.m.id}` });
  return { lateReviews, lateMilestones };
}

export async function mentorCoverage(db: Db) {
  const unconfirmed = await db.select({ id: sql<string>`p.id`, title: briefVersions.title }).from(sql`projects p`)
    .innerJoin(briefVersions, sql`${briefVersions.id} = p.current_version_id`)
    .where(sql`p.state in ('published','in_review','paused') and (p.mentor_confirmed_at is null or ${briefVersions.mentorId} is null)`);
  const mentors = await db.select({ id: user.id, name: user.name, capacity: mentorProfiles.capacity, verifiedAt: mentorProfiles.verifiedAt,
    active: sql<number>`(select count(*)::int from enrollments e where e.mentor_id = ${user.id} and e.state in ('active','submitted','revision_requested'))` })
    .from(mentorProfiles).innerJoin(user, eq(user.id, mentorProfiles.userId)).orderBy(desc(sql`4`));
  return { unconfirmed, mentors };
}

export async function verifyOrgWithNote(db: Db, actor: Actor, input: { orgId: string; note: string }) {
  await assertStaff(db, actor);
  if (input.note.trim().length < 5) throw new UserError("Say what you checked.");
  const now = new Date();
  const event = await db.transaction(async (tx) => {
    const [org] = await tx.update(organizations).set({ verifiedAt: now, verifiedBy: actor.id, verificationNote: input.note.trim() })
      .where(and(eq(organizations.id, input.orgId), isNull(organizations.verifiedAt))).returning({ id: organizations.id });
    if (!org) throw new UserError("This organization is already verified or no longer exists.");
    return audit(tx, actor.id, "organization_verified", "organization", org.id, input.note.trim(), { verifiedAt: now.toISOString() });
  });
  await notifyAll(db, await ownersOf(db, input.orgId), { kind: "org", essential: true, title: "Your organization is verified", body: "You can now submit briefs for review.",
    href: "/company", key: `org-verified:${input.orgId}` });
  return { eventId: event.id, orgId: input.orgId };
}

export async function undoOrgVerification(db: Db, actor: Actor, input: { orgId: string; eventId: string }) {
  await assertStaff(db, actor);
  const [event] = await db.select().from(auditEvents).where(and(
    eq(auditEvents.id, input.eventId), eq(auditEvents.action, "organization_verified"),
    eq(auditEvents.targetType, "organization"), eq(auditEvents.targetId, input.orgId), eq(auditEvents.actorId, actor.id),
  ));
  const verifiedAt = typeof event?.meta.verifiedAt === "string" ? new Date(event.meta.verifiedAt) : null;
  if (!event || !verifiedAt || Number.isNaN(verifiedAt.valueOf()) || Date.now() - event.createdAt.valueOf() > 10 * 60_000)
    throw new UserError("That verification can no longer be undone.");
  const dependent = await db.select({ id: projects.id }).from(projects)
    .where(and(eq(projects.orgId, input.orgId), inArray(projects.state, ["in_review", "published", "paused"]))).limit(1);
  if (dependent.length) throw new UserError("This organization now has active or reviewed briefs, so verification cannot be undone.");
  await db.transaction(async (tx) => {
    const [org] = await tx.update(organizations).set({ verifiedAt: null, verifiedBy: null, verificationNote: null })
      .where(and(eq(organizations.id, input.orgId), eq(organizations.verifiedAt, verifiedAt))).returning({ id: organizations.id });
    if (!org) throw new UserError("The verification changed after this action and was not undone.");
    await audit(tx, actor.id, "organization_verification_undone", "organization", org.id, "Undone within 10 minutes.", { verificationEventId: event.id });
  });
  await notifyAll(db, await ownersOf(db, input.orgId), { kind: "org", essential: true, title: "Organization verification was withdrawn",
    body: "Program staff will contact you if anything else is needed.", href: "/company", key: `org-unverified:${event.id}` });
}

export async function setOrgSuspension(db: Db, actor: Actor, input: { orgId: string; suspend: boolean; reason: string }) {
  await assertStaff(db, actor);
  if (input.suspend && input.reason.trim().length < 10) throw new UserError("Record why participation is being suspended.");
  const now = new Date();
  await db.transaction(async (tx) => {
    const [org] = await tx.update(organizations).set(input.suspend
      ? { suspendedAt: now, suspendedBy: actor.id, suspensionReason: input.reason.trim() }
      : { suspendedAt: null, suspendedBy: null, suspensionReason: null })
      .where(eq(organizations.id, input.orgId)).returning({ id: organizations.id });
    if (!org) throw new UserError("Organization not found.");
    if (input.suspend) await tx.update(projects).set({ state: "paused", stateReason: input.reason.trim(), updatedAt: now })
      .where(and(eq(projects.orgId, org.id), eq(projects.state, "published")));
    await audit(tx, actor.id, input.suspend ? "organization_suspended" : "organization_reinstated", "organization", org.id, input.reason.trim() || undefined);
  });
  await notifyAll(db, await ownersOf(db, input.orgId), { kind: "org", essential: true,
    title: input.suspend ? "Organization participation suspended" : "Organization participation restored",
    body: input.suspend ? input.reason.trim() : "Program staff restored access. Paused listings remain paused until you reopen them.",
    href: "/company", key: `org-suspension:${input.orgId}:${now.toISOString()}` });
}

export async function saveSkill(db: Db, actor: Actor, input: { id: string; name: string; aliases: string; active: boolean }) {
  await assertStaff(db, actor);
  const id = input.id.trim().toLowerCase();
  const name = input.name.trim();
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || name.length < 2) throw new UserError("Use a lowercase dash-separated ID and a skill name.");
  const aliases = [...new Set(input.aliases.split(",").map((x) => x.trim()).filter(Boolean))];
  const [before] = await db.select().from(skills).where(eq(skills.id, id));
  await db.insert(skills).values({ id, name, aliases, active: input.active }).onConflictDoUpdate({ target: skills.id, set: { name, aliases, active: input.active, updatedAt: new Date() } });
  await audit(db, actor.id, before ? "skill_updated" : "skill_created", "skill", id, undefined, { before, after: { name, aliases, active: input.active } });
}

export async function saveRubricTemplate(db: Db, actor: Actor, input: { name: string; criterion: string; description: string; threshold: number; skillId?: string }) {
  await assertStaff(db, actor);
  if (input.name.trim().length < 3) throw new UserError("Name the rubric template.");
  if (input.criterion.trim().length < 3 || input.description.trim().length < 10) throw new UserError("Write a criterion and a clear standard.");
  const parsed = criterionSchema.safeParse({ id: "c1", name: input.criterion.trim(), description: input.description.trim(), critical: true,
    threshold: Math.max(1, Math.min(4, Math.round(input.threshold))), skillId: input.skillId || undefined });
  if (!parsed.success) throw new UserError("Check the rubric criterion and threshold.");
  const criterion = parsed.data;
  const [latest] = await db.select({ version: rubricTemplates.version }).from(rubricTemplates)
    .where(eq(rubricTemplates.name, input.name.trim())).orderBy(desc(rubricTemplates.version)).limit(1);
  const [row] = await db.insert(rubricTemplates).values({ name: input.name.trim(), criteria: [criterion], version: (latest?.version ?? 0) + 1, updatedBy: actor.id }).returning();
  await audit(db, actor.id, "rubric_template_versioned", "rubric_template", row.id, undefined, { name: row.name, version: row.version });
}

export async function setHoliday(db: Db, actor: Actor, input: { day: string; name?: string }) {
  await assertStaff(db, actor);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.day)) throw new UserError("Choose a date.");
  if (input.name) {
    if (input.name.trim().length < 2) throw new UserError("Name the holiday.");
    await db.insert(holidays).values({ day: input.day, name: input.name.trim(), createdBy: actor.id })
      .onConflictDoUpdate({ target: holidays.day, set: { name: input.name.trim(), createdBy: actor.id } });
    await audit(db, actor.id, "holiday_saved", "holiday", input.day, input.name.trim());
  } else {
    await db.delete(holidays).where(eq(holidays.day, input.day));
    await audit(db, actor.id, "holiday_removed", "holiday", input.day);
  }
}
