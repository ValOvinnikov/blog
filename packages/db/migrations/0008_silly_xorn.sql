ALTER TABLE "bookmarks" DROP CONSTRAINT "bookmarks_user_id_post_id_pk";--> statement-breakpoint
ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_email_unique";--> statement-breakpoint
ALTER TABLE "bookmarks" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "tenant_id" uuid;--> statement-breakpoint
UPDATE "bookmarks" SET "tenant_id" = (SELECT "id" FROM "tenants" LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
UPDATE "subscribers" SET "tenant_id" = (SELECT "id" FROM "tenants" LIMIT 1) WHERE "tenant_id" IS NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "tenant_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_tenant_id_user_id_post_id_pk" PRIMARY KEY("tenant_id","user_id","post_id");--> statement-breakpoint
ALTER TABLE "bookmarks" ADD CONSTRAINT "bookmarks_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenant_id_email_unique" UNIQUE("tenant_id","email");
