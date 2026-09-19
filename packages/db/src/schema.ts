import { sql } from "drizzle-orm";
import {
  boolean, integer, jsonb, pgEnum, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid,
} from "drizzle-orm/pg-core";
import { ENROLLMENT_STATES, LISTING_STATES, type Brief, type Score } from "@iq/core";

const created = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const updated = () => timestamp("updated_at", { withTimezone: true }).notNull().defaultNow();

// ── Better Auth core tables (field names must match what Better Auth expects) ──

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  isStaff: boolean("is_staff").notNull().default(false),
  createdAt: created(),
  updatedAt: updated(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  createdAt: created(),
  updatedAt: updated(),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
  scope: text("scope"),
  password: text("password"),
  createdAt: created(),
  updatedAt: updated(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: created(),
  updatedAt: updated(),
});

// ── Organizations and roles ──
// A student is any user with a student profile. Company roles come from memberships. Staff is a flag.

export const organizations = pgTable("organizations", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
  verifiedBy: text("verified_by").references(() => user.id),
  createdAt: created(),
});

export const membershipRole = pgEnum("membership_role", ["owner", "mentor"]);

export const memberships = pgTable(
  "memberships",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    orgId: uuid("org_id").notNull().references(() => organizations.id, { onDelete: "cascade" }),
    role: membershipRole("role").notNull(),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.orgId, t.role] })],
);

export const studentProfiles = pgTable("student_profiles", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  bio: text("bio").notNull().default(""),
  pronouns: text("pronouns").notNull().default(""),
  discipline: text("discipline").notNull().default(""),
  interests: text("interests").array().notNull().default(sql`'{}'::text[]`),
  goals: text("goals").notNull().default(""),
  weeklyHours: integer("weekly_hours").notNull().default(0),
  timezone: text("timezone").notNull().default("UTC"),
  createdAt: created(),
});

export const skills = pgTable("skills", {
  id: text("id").primaryKey(), // slug, e.g. "signal-analysis"
  name: text("name").notNull(),
});

// PRO-02: what the student says they can do. Never platform-verified and never used for eligibility;
// verified tiers come only from skill_evidence.
export const skillClaimLevel = pgEnum("skill_claim_level", ["learning", "coursework", "practical"]);

export const skillClaims = pgTable(
  "skill_claims",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    skillId: text("skill_id").notNull().references(() => skills.id),
    level: skillClaimLevel("level").notNull(),
    note: text("note").notNull().default(""),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.skillId] })],
);

// ── Projects and immutable brief versions ──

export const listingState = pgEnum("listing_state", LISTING_STATES);

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey().defaultRandom(),
  orgId: uuid("org_id").notNull().references(() => organizations.id),
  ownerId: text("owner_id").notNull().references(() => user.id),
  state: listingState("state").notNull().default("draft"),
  currentVersionId: uuid("current_version_id"),
  reviewNote: text("review_note"),
  createdAt: created(),
  updatedAt: updated(),
});

export const briefVersions = pgTable(
  "brief_versions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    // Denormalized from content for search, filters and seat checks.
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    tier: text("tier").notNull(),
    beginner: boolean("beginner").notNull(),
    capacity: integer("capacity").notNull(),
    xp: integer("xp").notNull(), // reward rule snapshot (§10.2)
    mentorId: text("mentor_id").references(() => user.id),
    content: jsonb("content").$type<Brief>().notNull(),
    createdBy: text("created_by").notNull().references(() => user.id),
    createdAt: created(),
  },
  (t) => [uniqueIndex("brief_versions_project_version").on(t.projectId, t.version)],
);

export const savedProjects = pgTable(
  "saved_projects",
  {
    userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
    projectId: uuid("project_id").notNull().references(() => projects.id, { onDelete: "cascade" }),
    createdAt: created(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.projectId] })],
);

// ── Enrollment: one row from application to completion (§13.2) ──

export const enrollmentState = pgEnum("enrollment_state", ENROLLMENT_STATES);
export const rewardsStatus = pgEnum("rewards_status", ["none", "pending", "issued"]);

export const enrollments = pgTable(
  "enrollments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    studentId: text("student_id").notNull().references(() => user.id),
    briefVersionId: uuid("brief_version_id").notNull().references(() => briefVersions.id),
    mentorId: text("mentor_id").references(() => user.id),
    state: enrollmentState("state").notNull().default("applied"),
    motivation: text("motivation").notNull(),
    availability: text("availability").notNull().default(""),
    decisionNote: text("decision_note"),
    // ponytail: offer row + expiry is the seat reservation; separate reservation table if waitlists (R1) need it
    offerExpiresAt: timestamp("offer_expires_at", { withTimezone: true }),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    rewardsStatus: rewardsStatus("rewards_status").notNull().default("none"),
    createdAt: created(),
    updatedAt: updated(),
  },
  (t) => [
    uniqueIndex("enrollments_one_live_per_student")
      .on(t.projectId, t.studentId)
      .where(sql`${t.state} in ('applied', 'offered', 'active', 'submitted', 'revision_requested')`),
  ],
);

export const milestones = pgTable("milestones", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  doneAt: timestamp("done_at", { withTimezone: true }),
});

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id),
  body: text("body").notNull(),
  createdAt: created(),
});

// A stored upload (r2Key) or an external link (url). Exactly one is set.
export const files = pgTable("files", {
  id: uuid("id").primaryKey().defaultRandom(),
  enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
  uploaderId: text("uploader_id").notNull().references(() => user.id),
  name: text("name").notNull(),
  r2Key: text("r2_key"),
  url: text("url"),
  size: integer("size"),
  contentType: text("content_type"),
  sha256: text("sha256"),
  createdAt: created(),
});

export const submissions = pgTable(
  "submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    fileIds: uuid("file_ids").array().notNull().default(sql`'{}'::uuid[]`),
    contributionStatement: text("contribution_statement").notNull(),
    reflection: text("reflection").notNull().default(""),
    clientKey: text("client_key").notNull().unique(), // retry-safe submit (AC-07)
    createdAt: created(),
  },
  (t) => [uniqueIndex("submissions_enrollment_version").on(t.enrollmentId, t.version)],
);

export const decision = pgEnum("assessment_decision", ["accept", "revise", "not_complete"]);

export const assessments = pgTable("assessments", {
  id: uuid("id").primaryKey().defaultRandom(),
  submissionId: uuid("submission_id").notNull().unique().references(() => submissions.id),
  assessorId: text("assessor_id").notNull().references(() => user.id),
  scores: jsonb("scores").$type<Score[]>().notNull(),
  decision: decision("decision").notNull(),
  comment: text("comment").notNull(),
  revisionDueAt: timestamp("revision_due_at", { withTimezone: true }),
  createdAt: created(),
});

// ── Rewards: every row carries a unique idempotency key (§13.3, AC-10) ──

export const xpTransactions = pgTable("xp_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id),
  amount: integer("amount").notNull(),
  kind: text("kind", { enum: ["issue", "correction"] }).notNull(),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id),
  reason: text("reason").notNull(),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  createdAt: created(),
});

export const skillEvidence = pgTable(
  "skill_evidence",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id").notNull().references(() => user.id),
    skillId: text("skill_id").notNull().references(() => skills.id),
    projectId: uuid("project_id").notNull().references(() => projects.id),
    enrollmentId: uuid("enrollment_id").notNull().references(() => enrollments.id),
    assessmentId: uuid("assessment_id").notNull().references(() => assessments.id),
    assessorId: text("assessor_id").notNull().references(() => user.id),
    score: integer("score").notNull(),
    createdAt: created(),
  },
  (t) => [uniqueIndex("skill_evidence_enrollment_skill").on(t.enrollmentId, t.skillId)],
);

export const credentials = pgTable("credentials", {
  id: uuid("id").primaryKey().defaultRandom(), // public verification id
  userId: text("user_id").notNull().references(() => user.id),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id),
  kind: text("kind", { enum: ["completion", "achievement", "skill_tier"] }).notNull(),
  title: text("title").notNull(),
  skillId: text("skill_id").references(() => skills.id),
  tier: text("tier"),
  status: text("status", { enum: ["active", "revoked", "superseded"] }).notNull().default("active"),
  summary: text("summary").notNull().default(""), // the only project detail a public page shows
  isPublic: boolean("is_public").notNull().default(false),
  idempotencyKey: text("idempotency_key").notNull().unique(),
  issuedAt: created(),
});

// ── Notifications, analytics and audit (NTF, ANL-01, OPS-07) ──

export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull().references(() => user.id, { onDelete: "cascade" }),
  kind: text("kind").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull().default(""), // never confidential file contents (NTF-04)
  href: text("href").notNull(),
  essential: boolean("essential").notNull().default(false),
  dedupeKey: text("dedupe_key").notNull().unique(), // NTF-05: the same event never notifies twice
  readAt: timestamp("read_at", { withTimezone: true }),
  emailedAt: timestamp("emailed_at", { withTimezone: true }),
  emailError: text("email_error"), // INT-02: failures stay visible to operations
  createdAt: created(),
});

export const notificationPrefs = pgTable("notification_prefs", {
  userId: text("user_id").primaryKey().references(() => user.id, { onDelete: "cascade" }),
  emailOptional: boolean("email_optional").notNull().default(true),
  quietStart: integer("quiet_start").notNull().default(22), // local hour, 0-23
  quietEnd: integer("quiet_end").notNull().default(7),
  timezone: text("timezone").notNull().default("UTC"),
});

// Opaque ids and non-sensitive properties only; no message text, file contents or case narratives (§19.1).
export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  subjectId: text("subject_id"),
  actorId: text("actor_id"),
  props: jsonb("props").$type<Record<string, string | number | boolean | null>>().notNull().default({}),
  createdAt: created(),
});

export const auditEvents = pgTable("audit_events", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorId: text("actor_id").references(() => user.id),
  action: text("action").notNull(),
  targetType: text("target_type").notNull(),
  targetId: text("target_id").notNull(),
  reason: text("reason"),
  meta: jsonb("meta").$type<Record<string, unknown>>().notNull().default({}),
  createdAt: created(),
});

// ── Cases: blockers, extensions, reports, support and appeals (WRK-06, OPS-02/03/09/13, ASM-08) ──
// Private to the reporter and staff. Opening one never changes the student's record by itself.

export const caseType = pgEnum("case_type", ["blocker", "extension", "conduct", "support", "appeal"]);
export const caseStatus = pgEnum("case_status", ["open", "in_progress", "resolved"]);

export const cases = pgTable("cases", {
  id: uuid("id").primaryKey().defaultRandom(),
  number: integer("number").generatedAlwaysAsIdentity({ startWith: 1001 }).notNull().unique(), // ticket reference
  type: caseType("type").notNull(),
  status: caseStatus("status").notNull().default("open"),
  reporterId: text("reporter_id").notNull().references(() => user.id),
  enrollmentId: uuid("enrollment_id").references(() => enrollments.id),
  summary: text("summary").notNull(),
  requestedDays: integer("requested_days"),
  ownerId: text("owner_id").references(() => user.id),
  dueAt: timestamp("due_at", { withTimezone: true }).notNull(),
  resolution: text("resolution"),
  resolvedBy: text("resolved_by").references(() => user.id),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
  createdAt: created(),
  updatedAt: updated(),
});

export const caseUpdates = pgTable("case_updates", {
  id: uuid("id").primaryKey().defaultRandom(),
  caseId: uuid("case_id").notNull().references(() => cases.id, { onDelete: "cascade" }),
  authorId: text("author_id").notNull().references(() => user.id),
  body: text("body").notNull(),
  createdAt: created(),
});
