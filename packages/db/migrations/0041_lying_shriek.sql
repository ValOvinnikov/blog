CREATE TYPE "public"."header_action_phone_placement" AS ENUM('BAR', 'MENU');--> statement-breakpoint
CREATE TYPE "public"."header_action_style" AS ENUM('FILLED', 'OUTLINED', 'PLAIN');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_action_style" "header_action_style" DEFAULT 'FILLED' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_action_phone_placement" "header_action_phone_placement" DEFAULT 'MENU' NOT NULL;