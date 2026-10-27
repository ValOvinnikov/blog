CREATE TYPE "public"."busy_button_style" AS ENUM('LABEL', 'KEPT', 'EDGE');--> statement-breakpoint
CREATE TYPE "public"."spinner_style" AS ENUM('PRESET', 'BRAILLE', 'RING', 'DOTS', 'PULSE');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "busy_button_style" "busy_button_style" DEFAULT 'LABEL' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "spinner_style" "spinner_style" DEFAULT 'PRESET' NOT NULL;