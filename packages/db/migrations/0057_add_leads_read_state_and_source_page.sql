ALTER TABLE "leads" ADD COLUMN "source_document_id" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "source_locale" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "read_at" timestamp with time zone;