/**
 * Renames `blog_post.mainImage` -> `blog_post.heroImage` (#365). The field
 * stays optional (#320); this migration only moves the stored value onto the
 * new field name and removes the old one.
 *
 * Idempotency guard: skips documents where `heroImage` (the *target* shape)
 * is already set, regardless of whether `mainImage` (the *source* shape) is
 * still present — a doc that already has both must not be re-wrapped or
 * clobbered. Docs that never had a `mainImage` (it's optional) are a no-op
 * too, since there is nothing to move.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying app/service code that reads `heroImage` instead of `mainImage`,
 * so there is no window where live documents have neither field populated
 * for the code currently reading them.
 */
import { at, defineMigration, set, unset } from 'sanity/migrate';

/** The two shapes a `blog_post` document may currently be in. */
type TLegacyImageDoc = {
  mainImage?: unknown;
  heroImage?: unknown;
};

/**
 * Pure transform: legacy `mainImage` -> `heroImage`. Exported so it's
 * unit-testable without the Sanity migration runner.
 */
export const renamePostMainImageToHeroImage = (doc: TLegacyImageDoc) => {
  // Idempotency: target shape already present — never re-wrap or clobber it.
  if (doc.heroImage !== undefined) return undefined;
  // Optional field, never set on this doc — nothing to move.
  if (doc.mainImage === undefined) return undefined;

  return [at('heroImage', set(doc.mainImage)), at('mainImage', unset())];
};

export default defineMigration({
  title: 'Rename post mainImage to heroImage',
  documentTypes: ['blog_post'],
  migrate: {
    document(doc) {
      return renamePostMainImageToHeroImage(doc as TLegacyImageDoc);
    },
  },
});
