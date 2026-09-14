/**
 * Moves `settings_site.brand.specLine` to `brand.tagline` and rewrites its
 * nested `_type` (`specLine` -> `brandTagline`) to match the
 * `objects/brand-tagline.ts` schema rename.
 *
 * Idempotency guard: skips documents where `brand.tagline` (the *target*
 * field) is already set, regardless of whether `brand.specLine` (the
 * *source*) is still present — a doc carrying both must not be clobbered. A
 * doc with neither is a no-op.
 *
 * No companion migration exists for the sibling `skim` -> `postTakeaways`
 * rename: no document in either dataset carries a `skim` object, so there is
 * nothing to move.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/development-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates the dataset
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

const BRAND_TAGLINE_TYPE = 'brandTagline';

type TLegacySpecLineValue = {
  _type: string;
  [key: string]: unknown;
};

type TLegacyBrand = {
  specLine?: TLegacySpecLineValue;
  tagline?: unknown;
};

type TLegacySettingsSiteDoc = {
  brand?: TLegacyBrand;
};

export const renameSpecLineToTagline = (doc: TLegacySettingsSiteDoc) => {
  const brand = doc.brand;

  if (brand === undefined) return undefined;
  if (brand.tagline !== undefined) return undefined;
  if (brand.specLine === undefined) return undefined;

  return [
    at('brand.tagline', set({ ...brand.specLine, _type: BRAND_TAGLINE_TYPE })),
    at('brand.specLine', unset()),
  ];
};

export default defineMigration({
  title: 'Rename brand specLine to tagline',
  documentTypes: ['settings_site'],
  migrate: {
    document(doc) {
      return renameSpecLineToTagline(doc as unknown as TLegacySettingsSiteDoc);
    },
  },
});
