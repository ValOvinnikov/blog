CREATE TYPE "public"."header_bar_style" AS ENUM('FULL_WIDTH', 'FLOATING');--> statement-breakpoint
CREATE TYPE "public"."header_layout" AS ENUM('CLASSIC', 'LINKS_BESIDE_BRAND', 'CENTRED_LINKS', 'TWO_ROWS', 'CENTRED_BRAND', 'MENU_BUTTON');--> statement-breakpoint
CREATE TYPE "public"."header_submenu_style" AS ENUM('DROPDOWN', 'WIDE_PANEL');--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_layout" "header_layout" DEFAULT 'CLASSIC' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_submenu_style" "header_submenu_style" DEFAULT 'DROPDOWN' NOT NULL;--> statement-breakpoint
ALTER TABLE "site_config" ADD COLUMN "header_bar_style" "header_bar_style" DEFAULT 'FULL_WIDTH' NOT NULL;