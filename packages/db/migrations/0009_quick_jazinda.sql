ALTER TABLE "tenants" ADD COLUMN "name" text;--> statement-breakpoint
UPDATE "tenants" SET "name" = initcap(replace(replace("slug", '-', ' '), '_', ' ')) WHERE "name" IS NULL;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "name" SET NOT NULL;