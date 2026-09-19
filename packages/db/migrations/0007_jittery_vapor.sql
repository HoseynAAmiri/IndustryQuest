CREATE TABLE "dismissed_projects" (
	"user_id" text NOT NULL,
	"project_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "dismissed_projects_user_id_project_id_pk" PRIMARY KEY("user_id","project_id")
);
--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "public_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "proposed_summary" text;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "summary_status" text DEFAULT 'none' NOT NULL;--> statement-breakpoint
ALTER TABLE "credentials" ADD COLUMN "summary_reviewed_by" text;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "visibility" text DEFAULT 'private' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "share_token" text;--> statement-breakpoint
ALTER TABLE "dismissed_projects" ADD CONSTRAINT "dismissed_projects_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dismissed_projects" ADD CONSTRAINT "dismissed_projects_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_summary_reviewed_by_user_id_fk" FOREIGN KEY ("summary_reviewed_by") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_share_token_unique" UNIQUE("share_token");