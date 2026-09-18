CREATE TYPE "public"."skill_claim_level" AS ENUM('learning', 'coursework', 'practical');--> statement-breakpoint
CREATE TABLE "skill_claims" (
	"user_id" text NOT NULL,
	"skill_id" text NOT NULL,
	"level" "skill_claim_level" NOT NULL,
	"note" text DEFAULT '' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "skill_claims_user_id_skill_id_pk" PRIMARY KEY("user_id","skill_id")
);
--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "pronouns" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "student_profiles" ADD COLUMN "discipline" text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE "skill_claims" ADD CONSTRAINT "skill_claims_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "skill_claims" ADD CONSTRAINT "skill_claims_skill_id_skills_id_fk" FOREIGN KEY ("skill_id") REFERENCES "public"."skills"("id") ON DELETE no action ON UPDATE no action;