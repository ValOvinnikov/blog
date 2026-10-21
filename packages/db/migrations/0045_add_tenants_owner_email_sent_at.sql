ALTER TABLE "tenants" ADD COLUMN "owner_invite_heads_up_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_invite_nudge_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_site_ready_sent_at" timestamp;