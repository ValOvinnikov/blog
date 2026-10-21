CREATE TYPE "public"."blocked_identity_kind" AS ENUM('ADDRESS', 'DOMAIN');--> statement-breakpoint
CREATE TABLE "blocked_signup_identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"kind" "blocked_identity_kind" NOT NULL,
	"value" text NOT NULL,
	"reason" text NOT NULL,
	"created_by_admin_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "blocked_signup_identities_kind_value_unique" UNIQUE("kind","value")
);
--> statement-breakpoint
ALTER TABLE "blocked_signup_identities" ADD CONSTRAINT "blocked_signup_identities_created_by_admin_id_admins_id_fk" FOREIGN KEY ("created_by_admin_id") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;