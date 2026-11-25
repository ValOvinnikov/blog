CREATE TABLE "pinned_tenants" (
	"admin_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"pinned_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "pinned_tenants_admin_id_tenant_id_pk" PRIMARY KEY("admin_id","tenant_id")
);
--> statement-breakpoint
ALTER TABLE "pinned_tenants" ADD CONSTRAINT "pinned_tenants_admin_id_admins_id_fk" FOREIGN KEY ("admin_id") REFERENCES "public"."admins"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "pinned_tenants" ADD CONSTRAINT "pinned_tenants_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "pinned_tenants_tenant_id_idx" ON "pinned_tenants" USING btree ("tenant_id");