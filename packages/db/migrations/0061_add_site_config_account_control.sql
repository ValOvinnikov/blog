CREATE TYPE "public"."account_button_style" AS ENUM('PILL', 'CIRCLE');--> statement-breakpoint
CREATE TYPE "public"."account_panel_style" AS ENUM('CARD', 'PROFILE', 'HUB');--> statement-breakpoint
CREATE TYPE "public"."account_phone_placement" AS ENUM('BAR', 'MENU');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "account_button_style" "account_button_style" DEFAULT 'PILL' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "account_panel_style" "account_panel_style" DEFAULT 'CARD' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "account_phone_placement" "account_phone_placement" DEFAULT 'BAR' NOT NULL;