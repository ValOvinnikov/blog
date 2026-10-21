CREATE TABLE "magic_link_send_counters" (
	"key" text PRIMARY KEY NOT NULL,
	"window_started_at" timestamp NOT NULL,
	"count" integer NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "termsAcceptedAt" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "termsVersion" text;