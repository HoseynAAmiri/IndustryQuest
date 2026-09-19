ALTER TYPE "public"."case_type" ADD VALUE 'equivalency';--> statement-breakpoint
CREATE TABLE "equivalencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"evidence" text NOT NULL,
	"granted_by" text NOT NULL,
	"case_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mentor_profiles" (
	"user_id" text PRIMARY KEY NOT NULL,
	"headline" text DEFAULT '' NOT NULL,
	"expertise" text[] DEFAULT '{}'::text[] NOT NULL,
	"capacity" integer DEFAULT 3 NOT NULL,
	"timezone" text DEFAULT 'UTC' NOT NULL,
	"verified_at" timestamp with time zone,
	"verified_by" text,
	"verification_note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "skill_id" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "verification_note" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "is_demo" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "skill_evidence" ADD COLUMN "revoked_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "participation" text DEFAULT 'remote' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "extra_active_slots" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "extra_slots_reason" text;--> statement-breakpoint
ALTER TABLE "equivalencies" ADD CONSTRAINT "equivalencies_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equivalencies" ADD CONSTRAINT "equivalencies_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equivalencies" ADD CONSTRAINT "equivalencies_granted_by_user_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equivalencies" ADD CONSTRAINT "equivalencies_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mentor_profiles" ADD CONSTRAINT "mentor_profiles_verified_by_user_id_fk" FOREIGN KEY ("verified_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "equivalencies_user_skill" ON "equivalencies" USING btree ("user_id","skill_id");--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;