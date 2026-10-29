CREATE TYPE "public"."cookie_settings_button" AS ENUM('HIDDEN', 'SHOWN');--> statement-breakpoint
CREATE TYPE "public"."footer_background" AS ENUM('PRIMARY', 'SECONDARY', 'BRAND_PRIMARY');--> statement-breakpoint
CREATE TYPE "public"."footer_layout" AS ENUM('COLUMNS', 'CENTRED', 'COMPACT', 'BIG_WORDMARK');--> statement-breakpoint
CREATE TYPE "public"."footer_surface" AS ENUM('FULL_WIDTH', 'CARD');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "footer_layout" "footer_layout" DEFAULT 'COLUMNS' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "footer_background" "footer_background" DEFAULT 'BRAND_PRIMARY' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "footer_surface" "footer_surface" DEFAULT 'FULL_WIDTH' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "cookie_settings_button" "cookie_settings_button" DEFAULT 'HIDDEN' NOT NULL;