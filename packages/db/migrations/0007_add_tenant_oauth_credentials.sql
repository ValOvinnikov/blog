CREATE TABLE "tenant_oauth_credentials" (
	"tenant_id" uuid NOT NULL,
	"provider" text NOT NULL,
	"client_id" text NOT NULL,
	"client_secret_encrypted" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "tenant_oauth_credentials_tenant_id_provider_pk" PRIMARY KEY("tenant_id","provider")
);
--> statement-breakpoint
ALTER TABLE "tenant_oauth_credentials" ADD CONSTRAINT "tenant_oauth_credentials_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;