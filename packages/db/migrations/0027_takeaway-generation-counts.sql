CREATE TABLE "takeaway_generation_counts" (
	"tenant_id" uuid NOT NULL,
	"month" date NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "takeaway_generation_counts_tenant_id_month_pk" PRIMARY KEY("tenant_id","month")
);
--> statement-breakpoint
ALTER TABLE "takeaway_generation_counts" ADD CONSTRAINT "takeaway_generation_counts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;