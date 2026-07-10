/**
 * ILLUSTRATIVE TEMPLATE — not meant to be run as-is.
 *
 * This is a worked example of the `sanity/migrate` API, scaffolded to match
 * what `sanity migrations create` would generate for a document migration.
 * Copy this folder, rename it, and adapt the `migrate.document` handler (or
 * swap to the `array` / `object` / `string` / `node` node-visitor handlers)
 * for the real transform you need.
 *
 * Scenario shown here: the `author` document type is imagined to rename its
 * `role` string field to `jobTitle`. A schema change alone does not touch
 * existing documents — the old `role` value would be silently orphaned once
 * the field is removed from the schema. This migration copies the value
 * across and removes the old field, keyed off the live document type so it
 * is safe to run only against `author` documents (see `documentTypes` below).
 *
 * Do NOT run this against the real `author` schema unless `role` has
 * actually been renamed to `jobTitle` in schema-types/documents/blog/author.ts.
 *
 * Workflow (see ../README.md for full guardrails). The `dataset:export`
 * script already targets the `production` dataset, so pass only a destination:
 *   1. pnpm --filter cms dataset:export -- migrations/backups/production.tar.gz
 *   2. pnpm --filter cms migrate:dry -- rename-author-role-to-job-title
 *   3. Inspect the dry-run diff carefully.
 *   4. Only then: pnpm --filter cms migrate:run -- rename-author-role-to-job-title
 *      (human-gated — an agent must not run this step)
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

export default defineMigration({
  title: 'Rename author.role to author.jobTitle',
  documentTypes: ['author'],

  migrate: {
    document(doc) {
      const legacyRole = (doc as { role?: unknown }).role;

      if (typeof legacyRole !== 'string') {
        // Nothing to migrate on this document — leave it untouched.
        return undefined;
      }

      return [at('jobTitle', set(legacyRole)), at('role', unset())];
    },
  },
});
