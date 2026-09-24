/**
 * Backfills `settings_site.currency` to `'USD'` on every existing site
 * settings document (#3688). The field is new and required going forward,
 * but a document created before this schema change has no `currency` at
 * all, which would otherwise block it from being republished until an
 * editor picks one manually.
 *
 * Idempotency guard: skips documents where `currency` (the *target* field)
 * is already present — regardless of its value — so a document an editor
 * has already set to something other than USD is never clobbered by a
 * second run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying Studio code that requires `currency` on `settings_site`, so
 * there is no window where an existing document is invalid against the new
 * schema.
 */
import { at, defineMigration, set } from 'sanity/migrate';

type TSiteSettingsDoc = { currency?: string };

export const backfillSiteCurrency = (doc: TSiteSettingsDoc) => {
  if (doc.currency !== undefined) return undefined;

  return [at('currency', set('USD'))];
};

export default defineMigration({
  title: 'Backfill settings_site currency to USD',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return backfillSiteCurrency(doc as TSiteSettingsDoc);
    },
  },
});
