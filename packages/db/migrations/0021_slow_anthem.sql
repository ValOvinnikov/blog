CREATE TABLE "findings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"tenant_id" uuid,
	"source" text NOT NULL,
	"kind" text NOT NULL,
	"severity" text NOT NULL,
	"status" text NOT NULL,
	"dedupe_key" text NOT NULL,
	"details" jsonb,
	"first_seen_at" timestamp DEFAULT now() NOT NULL,
	"last_seen_at" timestamp DEFAULT now() NOT NULL,
	"resolved_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "findings" ADD CONSTRAINT "findings_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "findings_tenant_idx" ON "findings" USING btree ("tenant_id");--> statement-breakpoint
CREATE INDEX "findings_status_idx" ON "findings" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "findings_open_dedupe_key_idx" ON "findings" USING btree ("dedupe_key") WHERE "findings"."status" = 'OPEN';