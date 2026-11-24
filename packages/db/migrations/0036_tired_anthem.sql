ALTER TABLE "subscribers" DROP CONSTRAINT "subscribers_unsubscribe_token_hash_unique";--> statement-breakpoint
ALTER TABLE "subscribers" DROP COLUMN "unsubscribe_token_hash";