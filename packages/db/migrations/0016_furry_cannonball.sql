CREATE TABLE "settings_features" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"comments_enabled" boolean DEFAULT true NOT NULL,
	"ratings_enabled" boolean DEFAULT true NOT NULL,
	"bookmarks_enabled" boolean DEFAULT true NOT NULL,
	"newsletter_enabled" boolean DEFAULT false NOT NULL,
	"analytics_enabled" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "settings_features_tenant_id_unique" UNIQUE("tenant_id")
);
--> statement-breakpoint
ALTER TABLE "settings_features" ADD CONSTRAINT "settings_features_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;