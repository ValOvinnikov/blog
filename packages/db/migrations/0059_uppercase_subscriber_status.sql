ALTER TABLE "subscribers" ALTER COLUMN "status" SET DEFAULT 'PENDING';--> statement-breakpoint
UPDATE "subscribers" SET "status" = upper("status") WHERE "status" <> upper("status");