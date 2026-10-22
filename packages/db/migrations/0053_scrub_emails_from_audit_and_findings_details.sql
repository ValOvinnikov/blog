CREATE OR REPLACE FUNCTION "scrub_email_addresses"("value" jsonb) RETURNS jsonb
LANGUAGE plpgsql IMMUTABLE AS $$
DECLARE
  email_pattern constant text := '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}';
BEGIN
  CASE jsonb_typeof("value")
    WHEN 'object' THEN
      RETURN coalesce(
        (
          SELECT jsonb_object_agg("entry"."key", "scrub_email_addresses"("entry"."child"))
          FROM jsonb_each("value") AS "entry"("key", "child")
          WHERE NOT (
            jsonb_typeof("entry"."child") = 'string'
            AND "entry"."child" #>> '{}' ~ ('^' || email_pattern || '$')
          )
        ),
        '{}'::jsonb
      );
    WHEN 'array' THEN
      RETURN coalesce(
        (
          SELECT jsonb_agg("scrub_email_addresses"("item"."element") ORDER BY "item"."position")
          FROM jsonb_array_elements("value") WITH ORDINALITY AS "item"("element", "position")
        ),
        '[]'::jsonb
      );
    WHEN 'string' THEN
      RETURN to_jsonb(regexp_replace("value" #>> '{}', email_pattern, '[email removed]', 'g'));
    ELSE
      RETURN "value";
  END CASE;
END;
$$;--> statement-breakpoint
DO $$
DECLARE
  email_pattern constant text := '[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}';
  audit_event_rows integer;
  finding_rows integer;
BEGIN
  SELECT count(*) INTO audit_event_rows FROM "audit_events" WHERE "details"::text ~ email_pattern;
  SELECT count(*) INTO finding_rows FROM "findings" WHERE "details"::text ~ email_pattern;

  UPDATE "audit_events"
  SET "details" = ("details" - 'ownerEmail') || jsonb_build_object('ownerEmailUpdated', true)
  WHERE "action" = 'SETTINGS_UPDATED'
    AND "target_type" = 'TENANT'
    AND "details" ? 'ownerEmail';

  UPDATE "audit_events"
  SET "details" = (
    SELECT jsonb_build_object('fields', coalesce(jsonb_agg("entry"."key"), '[]'::jsonb))
    FROM jsonb_each("audit_events"."details") AS "entry"("key", "value")
    WHERE "entry"."value" <> 'null'::jsonb
  )
  WHERE "action" = 'SETTINGS_UPDATED'
    AND "target_type" = 'SITE_CONFIG'
    AND ("details" ? 'replyToAddress' OR "details" ? 'contactRecipient');

  UPDATE "audit_events"
  SET "details" = "scrub_email_addresses"("details")
  WHERE "details"::text ~ email_pattern;

  UPDATE "findings"
  SET "details" = "scrub_email_addresses"("details")
  WHERE "details"::text ~ email_pattern;

  RAISE NOTICE 'scrubbed email addresses from % audit_events row(s) and % findings row(s)', audit_event_rows, finding_rows;
END;
$$;--> statement-breakpoint
DROP FUNCTION "scrub_email_addresses"(jsonb);
