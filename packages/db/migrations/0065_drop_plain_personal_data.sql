ALTER TABLE "membership_invites" DROP CONSTRAINT "membership_invites_tenant_id_email_unique";--> statement-breakpoint
ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_tenant_id_email_unique";--> statement-breakpoint
DROP INDEX "users_email_index_idx";--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "name_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "email_index" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "leads" ALTER COLUMN "message_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_invites" ALTER COLUMN "email_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_invites" ALTER COLUMN "email_index" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "email_encrypted" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "email_index" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "membership_invites" ADD COLUMN "email_exact_index" text;--> statement-breakpoint
ALTER TABLE "subscribers" ADD COLUMN "email_exact_index" text;--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_index_idx" ON "users" USING btree ("emailIndex");--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "leads" DROP COLUMN "message";--> statement-breakpoint
ALTER TABLE "membership_invites" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "subscribers" DROP COLUMN "email";--> statement-breakpoint
ALTER TABLE "membership_invites" ADD CONSTRAINT "membership_invites_tenant_id_email_exact_index_unique" UNIQUE("tenant_id","email_exact_index");--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_tenant_id_email_exact_index_unique" UNIQUE("tenant_id","email_exact_index");