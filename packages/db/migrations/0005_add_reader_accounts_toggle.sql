ALTER TABLE "settings_features" ALTER COLUMN "comments_enabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings_features" ALTER COLUMN "ratings_enabled" SET DEFAULT false;--> statement-breakpoint
ALTER TABLE "settings_features" ADD COLUMN "reader_accounts_enabled" boolean DEFAULT false NOT NULL;