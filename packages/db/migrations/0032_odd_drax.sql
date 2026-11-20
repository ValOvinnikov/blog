CREATE TABLE "test_email_send_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "post_title" text;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "post_published_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "recipient_count" integer;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "sent_count" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "emails_needed" integer;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "allowance_left" integer;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "scheduled_for" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "settled_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "hand_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_interval" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "billing_currency" text;--> statement-breakpoint
CREATE INDEX "subscribers_tenant_status_confirmed_at_id_idx" ON "subscribers" USING btree ("tenant_id","status","confirmed_at","id");