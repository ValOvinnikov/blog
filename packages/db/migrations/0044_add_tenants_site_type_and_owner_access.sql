CREATE TYPE "public"."site_type" AS ENUM('BLOG', 'PORTFOLIO', 'PERSONAL', 'DOCS', 'BLANK', 'BUSINESS', 'PRODUCT');--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "site_type" "site_type";--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "site_template_version" integer;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_sanity_invite_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_invite_sent_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_invite_accepted_at" timestamp;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_sanity_user_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_login_provider" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "owner_sanity_role" text;