ALTER TABLE "subscribers" RENAME COLUMN "confirmation_token" TO "confirmation_token_hash";--> statement-breakpoint
ALTER TABLE "subscribers" RENAME COLUMN "unsubscribe_token" TO "unsubscribe_token_hash";--> statement-breakpoint
ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_confirmation_token_unique";--> statement-breakpoint
ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_unsubscribe_token_unique";--> statement-breakpoint
UPDATE "subscribers" SET "confirmation_token_hash" = encode(sha256(convert_to("confirmation_token_hash", 'UTF8')), 'hex'), "unsubscribe_token_hash" = encode(sha256(convert_to("unsubscribe_token_hash", 'UTF8')), 'hex');--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_confirmation_token_hash_unique" UNIQUE("confirmation_token_hash");--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_unsubscribe_token_hash_unique" UNIQUE("unsubscribe_token_hash");