CREATE TABLE "tenant_entitlement_grants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"key" text NOT NULL,
	"value" integer,
	"note" text,
	"granted_by" uuid,
	"granted_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp,
	"revoked_at" timestamp,
	"revoked_by" uuid
);
--> statement-breakpoint
ALTER TABLE "tenant_entitlement_grants" ADD CONSTRAINT "tenant_entitlement_grants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlement_grants" ADD CONSTRAINT "tenant_entitlement_grants_granted_by_admins_id_fk" FOREIGN KEY ("granted_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_entitlement_grants" ADD CONSTRAINT "tenant_entitlement_grants_revoked_by_admins_id_fk" FOREIGN KEY ("revoked_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_entitlement_grants_open_idx" ON "tenant_entitlement_grants" USING btree ("tenant_id","kind","key") WHERE "tenant_entitlement_grants"."revoked_at" is null;