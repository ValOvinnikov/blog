CREATE TYPE "public"."locale_code" AS ENUM('EN', 'NL', 'FR', 'DE', 'ES');--> statement-breakpoint
UPDATE "tenants" SET "locale" = upper(trim("locale"));--> statement-breakpoint
DO $$
DECLARE
  unsupported text;
BEGIN
  SELECT string_agg(DISTINCT "locale", ', ') INTO unsupported
  FROM "tenants"
  WHERE NOT ("locale" = ANY (enum_range(NULL::"public"."locale_code")::text[]));
  IF unsupported IS NOT NULL THEN
    RAISE EXCEPTION 'tenants.locale holds values outside the supported language list: %. Map them to a supported code before re-running this migration.', unsupported;
  END IF;
END $$;--> statement-breakpoint
ALTER TABLE "tenants" ALTER COLUMN "locale" SET DATA TYPE "public"."locale_code" USING "locale"::"public"."locale_code";--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN "additional_locales" "locale_code"[] DEFAULT '{}' NOT NULL;