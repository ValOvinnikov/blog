CREATE TABLE "email_delivery_outcome_counts" (
	"tenant_id" uuid NOT NULL,
	"day" date NOT NULL,
	"outcome" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "email_delivery_outcome_counts_tenant_id_day_outcome_pk" PRIMARY KEY("tenant_id","day","outcome")
);
--> statement-breakpoint
CREATE TABLE "email_send_counts" (
	"tenant_id" uuid NOT NULL,
	"day" date NOT NULL,
	"email_type" text NOT NULL,
	"count" integer DEFAULT 0 NOT NULL,
	CONSTRAINT "email_send_counts_tenant_id_day_email_type_pk" PRIMARY KEY("tenant_id","day","email_type")
);
--> statement-breakpoint
CREATE TABLE "newsletter_post_sends" (
	"tenant_id" uuid NOT NULL,
	"post_id" text NOT NULL,
	"claimed_at" timestamp NOT NULL,
	CONSTRAINT "newsletter_post_sends_tenant_id_post_id_pk" PRIMARY KEY("tenant_id","post_id")
);
--> statement-breakpoint
ALTER TABLE "email_config" ADD COLUMN "email_new_posts" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "email_delivery_outcome_counts" ADD CONSTRAINT "email_delivery_outcome_counts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "email_send_counts" ADD CONSTRAINT "email_send_counts_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD CONSTRAINT "newsletter_post_sends_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "subscribers_tenant_status_id_idx" ON "subscribers" USING btree ("tenant_id","status","id");