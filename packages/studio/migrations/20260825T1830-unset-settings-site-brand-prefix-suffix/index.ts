/**
 * Unsets `settings_site.brand.prefix`/`brand.suffix` — fields the current
 * `brand` schema no longer declares; `brand.name` already holds the
 * fully-combined value. Idempotency guard: only unsets whichever field is
 * actually present, so an already-migrated doc produces no patch.
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
