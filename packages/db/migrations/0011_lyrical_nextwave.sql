ALTER TABLE "tenants" ALTER COLUMN "sanity_project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "sanity_dataset" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "provisioning_status" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "provisioning_steps" jsonb;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "studio_vercel_project_id" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "seeded_at" timestamp;