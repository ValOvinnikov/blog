CREATE TYPE "public"."granted_via" AS ENUM('BREAK_GLASS', 'PROMOTION');--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "granted_by" text;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "granted_via" "granted_via";--> statement-breakpoint
UPDATE "admins" SET "granted_via" = 'BREAK_GLASS' WHERE "granted_via" IS NULL;--> statement-breakpoint
ALTER TABLE "admins" ALTER COLUMN "granted_via" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD COLUMN "granted_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "admins" ADD CONSTRAINT "admins_granted_by_users_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;