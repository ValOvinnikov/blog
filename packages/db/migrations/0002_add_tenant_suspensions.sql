CREATE SEQUENCE "public"."tenant_suspension_reference_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 9223372036854775807 START WITH 1 CACHE 1;--> statement-breakpoint
CREATE TABLE "tenant_suspensions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text DEFAULT 'SUS-' || lpad(nextval('tenant_suspension_reference_seq')::text, 6, '0') NOT NULL,
	"tenant_id" uuid NOT NULL,
	"category" text NOT NULL,
	"description" text NOT NULL,
	"suspended_by" uuid,
	"suspended_at" timestamp DEFAULT now() NOT NULL,
	"lifted_at" timestamp,
	"lifted_by" uuid,
	CONSTRAINT "tenant_suspensions_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
ALTER TABLE "tenant_suspensions" ADD CONSTRAINT "tenant_suspensions_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_suspensions" ADD CONSTRAINT "tenant_suspensions_suspended_by_admins_id_fk" FOREIGN KEY ("suspended_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tenant_suspensions" ADD CONSTRAINT "tenant_suspensions_lifted_by_admins_id_fk" FOREIGN KEY ("lifted_by") REFERENCES "public"."admins"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tenant_suspensions_open_tenant_idx" ON "tenant_suspensions" USING btree ("tenant_id") WHERE "tenant_suspensions"."lifted_at" is null;