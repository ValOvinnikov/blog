ALTER TABLE "subscribers" ADD COLUMN "unsubscribe_token" text;--> statement-breakpoint
UPDATE "subscribers" SET "unsubscribe_token" = gen_random_uuid()::text WHERE "unsubscribe_token" IS NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ALTER COLUMN "unsubscribe_token" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "subscribers" ADD CONSTRAINT "subscribers_unsubscribe_token_unique" UNIQUE("unsubscribe_token");
