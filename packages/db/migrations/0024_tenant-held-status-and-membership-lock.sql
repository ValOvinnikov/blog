ALTER TABLE "memberships" ADD COLUMN "locked_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "status_before_hold" "tenant_status";