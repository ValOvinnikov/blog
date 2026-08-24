/**
 * Removes `blog_author.slug` (#1975) — the author-page slug is dead now that
 * bylines link out via `profilePage` instead.
 *
 * Idempotency guard: skips documents where `slug` is already absent — a doc
 * that never had one, or one already migrated, is a no-op either way.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying schema/service/web code that no longer expects `slug` on
 * `blog_author`, so there is no window where authoring UI still shows a
 * stale field.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TLegacySlugDoc = {
  slug?: unknown;
};

/**
 * Pure transform: unset the legacy `slug` field. Exported so it's
 * unit-testable without the Sanity migration runner.
 */
export const removeBlogAuthorSlug = (doc: TLegacySlugDoc) => {
  // Idempotency: target shape (no slug) already reached — nothing to unset.
  if (doc.slug === undefined) return undefined;

  return [at('slug', unset())];
};

export default defineMigration({
  title: 'Remove blog_author slug',
  documentTypes: ['blog_author'],
  migrate: {
    document(doc) {
      return removeBlogAuthorSlug(doc as TLegacySlugDoc);
    },
  },
});
