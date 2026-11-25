CREATE TYPE "public"."color_mode" AS ENUM('READER', 'LIGHT', 'DARK');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "color_mode" "color_mode" DEFAULT 'READER' NOT NULL;