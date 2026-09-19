ALTER TABLE "enrollments" ADD COLUMN "proposed_version_id" uuid;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "proposal_reason" text;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "mentor_confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "state_reason" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_proposed_version_id_brief_versions_id_fk" FOREIGN KEY ("proposed_version_id") REFERENCES "public"."brief_versions"("id") ON DELETE no action ON UPDATE no action;