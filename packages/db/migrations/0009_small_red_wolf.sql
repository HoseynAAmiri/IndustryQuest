ALTER TYPE "public"."case_type" ADD VALUE 'mentor_feedback';--> statement-breakpoint
ALTER TYPE "public"."case_type" ADD VALUE 'project_feedback';--> statement-breakpoint
ALTER TYPE "public"."case_type" ADD VALUE 'reviewer_conflict';--> statement-breakpoint
ALTER TYPE "public"."case_type" ADD VALUE 'deletion';--> statement-breakpoint
CREATE TABLE "blocked_users" (
	"blocker_id" text NOT NULL,
	"blocked_id" text NOT NULL,
	"enrollment_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_users_blocker_id_blocked_id_enrollment_id_pk" PRIMARY KEY("blocker_id","blocked_id","enrollment_id")
);
--> statement-breakpoint
CREATE TABLE "holidays" (
	"day" date PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rubric_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"criteria" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"updated_by" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "two_factor" (
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"backup_codes" text NOT NULL,
	"user_id" text NOT NULL,
	"verified" boolean DEFAULT true NOT NULL,
	"failed_verification_count" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "paused_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "pause_reason" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "access_archived_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspended_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspended_by" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "suspension_reason" text;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "aliases" text[] DEFAULT '{}'::text[] NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "active" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "skills" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "two_factor_enabled" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocker_id_user_id_fk" FOREIGN KEY ("blocker_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blocked_id_user_id_fk" FOREIGN KEY ("blocked_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_enrollment_id_enrollments_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "holidays" ADD CONSTRAINT "holidays_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "rubric_templates" ADD CONSTRAINT "rubric_templates_updated_by_user_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "two_factor" ADD CONSTRAINT "two_factor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_suspended_by_user_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;