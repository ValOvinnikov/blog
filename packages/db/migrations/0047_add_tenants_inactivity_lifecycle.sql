ALTER TABLE "tenants" ADD COLUMN "last_activity_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "inactivity_warned_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "suspended_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "deletion_notified_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "suspension_reason" text;