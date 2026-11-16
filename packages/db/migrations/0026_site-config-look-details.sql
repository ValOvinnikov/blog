CREATE TYPE "public"."divider_width" AS ENUM('HAIRLINE', 'BOLD');--> statement-breakpoint
CREATE TYPE "public"."heading_case" AS ENUM('AS_WRITTEN', 'UPPERCASE');--> statement-breakpoint
CREATE TYPE "public"."heading_weight" AS ENUM('REGULAR', 'MEDIUM', 'SEMIBOLD', 'BOLD');--> statement-breakpoint
CREATE TYPE "public"."image_proportion" AS ENUM('AS_DESIGNED', 'WIDE', 'CLASSIC', 'SQUARE');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "heading_weight" "heading_weight" DEFAULT 'MEDIUM' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "heading_case" "heading_case" DEFAULT 'AS_WRITTEN' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "image_proportion" "image_proportion" DEFAULT 'AS_DESIGNED' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "divider_width" "divider_width" DEFAULT 'HAIRLINE' NOT NULL;