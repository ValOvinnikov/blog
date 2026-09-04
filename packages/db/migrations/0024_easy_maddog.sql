CREATE TABLE "email_config" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"logo_asset_url" text,
	"sender_name" text,
	"reply_to_address" text,
	"footer_postal_address" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_config_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
CREATE TABLE "email_templates" (
	"tenant_id" uuid NOT NULL,
	"template_type" text NOT NULL,
	"subject" text,
	"body" jsonb,
	"logo_asset_url" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "email_templates_tenant_id_template_type_pk" PRIMARY KEY("tenant_id","template_type")
);
--> statement-breakpoint
ALTER TABLE "email_config" ADD CONSTRAINT "email_config_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_templates" ADD CONSTRAINT "email_templates_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;