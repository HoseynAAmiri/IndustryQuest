ALTER TABLE "enrollments" ADD COLUMN "draft_contribution" text;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "draft_reflection" text;--> statement-breakpoint
ALTER TABLE "files" ADD COLUMN "description" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "is_question" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "answered_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "file_id" uuid;