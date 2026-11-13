CREATE TABLE "stripe_prices" (
	"lookup_key" text NOT NULL,
	"currency" text NOT NULL,
	"unit_amount" integer NOT NULL,
	"stripe_price_id" text NOT NULL,
	"stripe_product_id" text NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "stripe_prices_lookup_key_currency_pk" PRIMARY KEY("lookup_key","currency")
);
--> statement-breakpoint
CREATE TABLE "stripe_promotion_codes" (
	"promotion_code_id" text PRIMARY KEY NOT NULL,
	"code" text NOT NULL,
	"percent_off" double precision,
	"amount_off_by_currency" jsonb,
	"duration" text NOT NULL,
	"duration_in_months" integer,
	"applies_to_product_ids" text[],
	"expires_at" timestamp,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE INDEX "stripe_prices_stripe_price_id_idx" ON "stripe_prices" USING btree ("stripe_price_id");--> statement-breakpoint
CREATE INDEX "stripe_promotion_codes_code_idx" ON "stripe_promotion_codes" USING btree ("code");