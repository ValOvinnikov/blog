UPDATE "site_config" SET "spinner_style" = CASE "preset" WHEN 'EDITORIAL' THEN 'RING'::"public"."spinner_style" ELSE 'BRAILLE'::"public"."spinner_style" END WHERE "spinner_style" = 'PRESET';--> statement-breakpoint
ALTER TABLE "site_config" ALTER COLUMN "spinner_style" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "site_config" ALTER COLUMN "spinner_style" SET DEFAULT 'BRAILLE'::text;--> statement-breakpoint
DROP TYPE "public"."spinner_style";--> statement-breakpoint
CREATE TYPE "public"."spinner_style" AS ENUM('BRAILLE', 'RING', 'DOTS', 'PULSE');--> statement-breakpoint
ALTER TABLE "site_config" ALTER COLUMN "spinner_style" SET DEFAULT 'BRAILLE'::"public"."spinner_style";--> statement-breakpoint
ALTER TABLE "site_config" ALTER COLUMN "spinner_style" SET DATA TYPE "public"."spinner_style" USING "spinner_style"::"public"."spinner_style";