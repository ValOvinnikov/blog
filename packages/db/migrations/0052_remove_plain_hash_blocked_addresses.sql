-- Custom SQL migration file, put your code below! --
DELETE FROM "blocked_signup_identities"
WHERE "kind" = 'ADDRESS'
  AND "value" ~ '^[0-9a-f]{64}$';
