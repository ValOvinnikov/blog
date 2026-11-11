CREATE TABLE "email_delivery_events" (
	"event_id" text PRIMARY KEY NOT NULL,
	"tenant_id" uuid NOT NULL,
	"received_at" timestamp NOT NULL
);
--> statement-breakpoint
ALTER TABLE "email_delivery_events" ADD CONSTRAINT "email_delivery_events_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;