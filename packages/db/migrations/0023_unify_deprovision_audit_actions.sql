-- Custom SQL migration file, put your code below! --
-- `action` is plain text, not a pgEnum, so renaming the deprovisioning
-- vocabulary application-side needs the historical rows rewritten here.
-- Order matters: the old `DEPROVISIONED` (the platform app's dispatch event)
-- has to move out of the way before the old `ARCHIVED` (the CLI's completion
-- event) takes that name. Only `TENANT` rows carry either action today, but
-- both statements stay unscoped by target type — the vocabulary is
-- target-agnostic by design, so a row of another type would mean the same
-- thing.
UPDATE "audit_events"
SET "action" = 'DEPROVISION_REQUESTED'
WHERE "action" = 'DEPROVISIONED';
--> statement-breakpoint
UPDATE "audit_events"
SET "action" = 'DEPROVISIONED'
WHERE "action" = 'ARCHIVED';
