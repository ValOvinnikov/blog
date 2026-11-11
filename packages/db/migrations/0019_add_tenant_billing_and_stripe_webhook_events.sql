CREATE TABLE "stripe_webhook_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"handled_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "stripe_promotion_code" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "trial_ends_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "downgrade_grace_started_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "grace_started_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "grace_halfway_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "grace_ending_email_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_customer_id_unique" UNIQUE("stripe_customer_id");--> statement-breakpoint
ALTER TABLE "tenants" ADD CONSTRAINT "tenants_stripe_subscription_id_unique" UNIQUE("stripe_subscription_id");