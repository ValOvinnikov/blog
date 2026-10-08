CREATE TABLE "email_template_logos" (
	"tenant_id" uuid NOT NULL,
	"template_type" text NOT NULL,
	"logo_asset_url" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_template_logos_tenant_id_template_type_pk" PRIMARY KEY("tenant_id","template_type")
);
--> statement-breakpoint
ALTER TABLE "email_template_logos" ADD CONSTRAINT "email_template_logos_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
INSERT INTO "email_template_logos" ("tenant_id", "template_type", "logo_asset_url")
SELECT DISTINCT ON ("tenant_id", "template_type") "tenant_id", "template_type", "logo_asset_url"
FROM "email_templates"
WHERE "logo_asset_url" IS NOT NULL
ORDER BY "tenant_id", "template_type", "updated_at" DESC;--> statement-breakpoint
ALTER TABLE "email_templates" DROP COLUMN "logo_asset_url";