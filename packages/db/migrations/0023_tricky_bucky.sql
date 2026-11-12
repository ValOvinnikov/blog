CREATE TABLE "newsletter_limit_notices" (
	"tenant_id" uuid NOT NULL,
	"month" date NOT NULL,
	"kind" text NOT NULL,
	"sent_at" timestamp NOT NULL,
	CONSTRAINT "newsletter_limit_notices_tenant_id_month_kind_pk" PRIMARY KEY("tenant_id","month","kind")
);
--> statement-breakpoint
ALTER TABLE "email_config" ADD COLUMN "newsletter_paused_at" timestamp;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "outcome" text;--> statement-breakpoint
ALTER TABLE "newsletter_post_sends" ADD COLUMN "skip_reason" text;--> statement-breakpoint
ALTER TABLE "newsletter_limit_notices" ADD CONSTRAINT "newsletter_limit_notices_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;