ALTER TABLE "users" ADD COLUMN "nameEncrypted" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailEncrypted" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "emailIndex" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "name_encrypted" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_encrypted" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "email_index" text;--> statement-breakpoint
ALTER TABLE "leads" ADD COLUMN "message_encrypted" text;--> statement-breakpoint
ALTER TABLE "membership_invites" ADD COLUMN "email_encrypted" text;--> statement-breakpoint
ALTER TABLE "membership_invites" ADD COLUMN "email_index" text;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "email_encrypted" text;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "email_index" text;--> statement-breakpoint
CREATE INDEX "users_email_index_idx" ON "users" USING btree ("emailIndex");--> statement-breakpoint
CREATE INDEX "membership_invites_email_index_idx" ON "membership_invites" USING btree ("email_index");--> statement-breakpoint
CREATE INDEX "subscribers_tenant_email_index_idx" ON "subscribers" USING btree ("tenant_id","email_index");