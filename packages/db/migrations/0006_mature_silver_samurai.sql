CREATE TYPE "public"."density" AS ENUM('DEFAULT', 'COMPACT');--> statement-breakpoint
CREATE TYPE "public"."font_choice" AS ENUM('SPACE_GROTESK', 'NEWSREADER', 'JETBRAINS_MONO', 'FRAUNCES', 'INTER');--> statement-breakpoint
CREATE TYPE "public"."preset_id" AS ENUM('CONSOLE', 'EDITORIAL');--> statement-breakpoint
CREATE TYPE "public"."radius_scale" AS ENUM('SM', 'MD', 'LG', 'XL');--> statement-breakpoint
CREATE TABLE "site_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"preset" "preset_id" NOT NULL,
	"accent_hue" integer NOT NULL,
	"logo_hue" integer,
	"heading_font" "font_choice" NOT NULL,
	"body_font" "font_choice" NOT NULL,
	"radius_scale" "radius_scale" NOT NULL,
	"density" "density" NOT NULL,
	"logo_asset_url" text,
	"favicon_asset_url" text,
	"voice_overrides" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "site_config_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "site_config" ADD CONSTRAINT "site_config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;