CREATE TYPE "public"."breadcrumb_background" AS ENUM('PRIMARY', 'SECONDARY', 'BRAND_PRIMARY', 'INK');--> statement-breakpoint
CREATE TYPE "public"."header_background" AS ENUM('PRIMARY', 'SECONDARY', 'BRAND_PRIMARY', 'INK');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_background" "header_background" DEFAULT 'PRIMARY' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "breadcrumb_background" "breadcrumb_background" DEFAULT 'PRIMARY' NOT NULL;