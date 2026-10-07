CREATE TYPE "public"."card_style" AS ENUM('ACCENT_BAR', 'OUTLINED');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "card_style" "card_style" DEFAULT 'ACCENT_BAR' NOT NULL;