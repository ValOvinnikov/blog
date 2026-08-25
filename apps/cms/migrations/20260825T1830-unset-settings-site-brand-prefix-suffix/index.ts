/**
 * Unsets `settings_site.brand.prefix`/`brand.suffix` — fields the current
 * `brand` schema (`src/schema-types/objects/brand.ts`) never declares.
 * `brand.name` already holds the fully-combined value (confirmed:
 * `name: "valstack.dev"` = old `prefix: "valstack"` + `suffix: ".dev"`), so
 * this is a pure cleanup of stale data with no replacement value to write.
 *
 * Idempotency guard: only unsets whichever of the two fields is actually
 * present on the doc, so a doc with neither (already migrated) produces no
 * patch at all.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/<dataset>-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates the target dataset
 *
 * Affects both `development` and `production` — run against each.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TSettingsSiteDoc = {
  brand?: {
    prefix?: unknown;
    suffix?: unknown;
  };
};

export const removeStaleBrandPrefixSuffix = (doc: TSettingsSiteDoc) => {
  const { brand } = doc;
  if (!brand) return undefined;

  const patches = [
    ...(brand.prefix !== undefined ? [at('brand.prefix', unset())] : []),
    ...(brand.suffix !== undefined ? [at('brand.suffix', unset())] : []),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Unset stale settings_site.brand.prefix/suffix',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return removeStaleBrandPrefixSuffix(doc as unknown as TSettingsSiteDoc);
    },
  },
});
