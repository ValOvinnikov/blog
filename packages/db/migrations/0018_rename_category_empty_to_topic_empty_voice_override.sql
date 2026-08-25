-- Custom SQL migration file, put your code below! --
-- voiceOverrides is a single jsonb column keyed by override name, not a
-- column per key — renaming the "categoryEmpty" key application-side needs a
-- data rewrite here too. Only rows that actually carry the old key are
-- touched, and every other key in the object is left untouched.
UPDATE "site_config"
SET "voice_overrides" = ("voice_overrides" - 'categoryEmpty')
  || jsonb_build_object('topicEmpty', "voice_overrides" -> 'categoryEmpty')
WHERE "voice_overrides" ? 'categoryEmpty';
