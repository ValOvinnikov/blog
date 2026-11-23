ALTER TYPE "public"."granted_via" ADD VALUE 'INVITE';--> statement-breakpoint
CREATE TABLE "admin_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email_encrypted" text NOT NULL,
	"email_index" text NOT NULL,
	"email_exact_index" text NOT NULL,
	"role" "admin_role" NOT NULL,
	"invited_by" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	CONSTRAINT "admin_invites_email_exact_index_unique" UNIQUE("email_exact_index")
);
--> statement-breakpoint
ALTER TABLE "admin_invites" ADD CONSTRAINT "admin_invites_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "admin_invites_email_index_idx" ON "admin_invites" USING btree ("email_index");