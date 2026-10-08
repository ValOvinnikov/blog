-- Custom SQL migration file, put your code below! --
-- Nests each tenant's flat override map under its default locale. A row
-- whose keys are already locale codes is skipped, so re-running is a no-op.
UPDATE "site_config" AS sc
SET "voice_overrides" = jsonb_build_object(t."locale"::text, sc."voice_overrides")
FROM "tenants" AS t
WHERE t."id" = sc."tenant_id"
  AND sc."voice_overrides" <> '{}'::jsonb
  AND NOT EXISTS (
    SELECT 1
    FROM jsonb_object_keys(sc."voice_overrides") AS k(key)
    WHERE k.key = ANY (enum_range(NULL::"locale_code")::text[])
  );
