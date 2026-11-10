CREATE TYPE "public"."button_shape" AS ENUM('SQUARE', 'ROUNDED', 'PILL');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "button_shape" "button_shape" DEFAULT 'ROUNDED' NOT NULL;