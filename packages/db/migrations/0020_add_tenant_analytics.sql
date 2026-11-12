CREATE TABLE "tenant_analytics" (
	"tenant_id" uuid PRIMARY KEY NOT NULL,
	"provider" text NOT NULL,
	"analytics_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tenant_analytics" ADD CONSTRAINT "tenant_analytics_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;