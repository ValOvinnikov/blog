ALTER TABLE "memberships" ADD COLUMN "sanity_invite_id" text;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "sanity_invite_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "sanity_invite_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "sanity_user_id" text;--> statement-breakpoint
ALTER TABLE "memberships" ADD COLUMN "sanity_login_provider" text;