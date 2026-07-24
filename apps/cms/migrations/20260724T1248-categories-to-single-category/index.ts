/**
 * Narrows `blog_post.categories` (required array, max 4, references to
 * `blog_category`) to a single required `category` reference (#811, part of
 * epic #809). Selection rule is fully automatic: `category = categories[0]`
 * for every existing post — this codifies what the codebase already treats
 * as the de facto primary category everywhere it only shows one (eyebrow
 * link, hero fallback, card badge). No manual editorial review.
 *
 * The pure `category = categories[0]` transform lives in `./transform.ts`
 * (`categoriesToSingleCategory`); the full document-level patch builder below
 * (`moveCategoriesToSingleCategory`) composes it with the idempotency guard
 * and is what `document()` delegates to. Both are exported so this migration
 * is unit-testable without a live dataset connection — see
 * `./index.test.ts` and `./transform.test.ts`.
 *
 * Idempotency guards:
 *   - A doc with no `categories` field is already migrated — no-op.
 *   - `category` is written with `setIfMissing`, never `set` — a doc that
 *     already has `category` (e.g. a partially-completed prior run) is never
 *     clobbered; `categories` is still unset to finish the cleanup.
 *   - An empty `categories` array (no first entry) writes no `category`
 *     mutation, but `categories` is still unset. This mirrors the old
 *     schema's `.required()` without `.min(1)` — an empty array was never
 *     supposed to happen, so leaving `category` unset here is a deliberate,
 *     documented no-op rather than a silent gap (flagged in review of #811).
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying service/web code that reads `category` (singular) instead of
 * `categories`, so there is no window where live documents have neither
 * shape populated for the code currently reading them.
 */
import { at, defineMigration, setIfMissing, unset } from 'sanity/migrate';

import { categoriesToSingleCategory, type TLegacyPostDoc } from './transform';

/**
 * Full document-level transform: builds the patch mutations that move a
 * legacy `categories[]` array onto the new single `category` reference,
 * including the idempotency guard. Exported so `document()`'s behaviour is
 * unit-testable without the Sanity migration runner — see `./index.test.ts`.
 */
export const moveCategoriesToSingleCategory = (doc: TLegacyPostDoc) => {
  const { categories } = doc;

  // Already migrated — nothing left to move.
  if (!categories) return undefined;

  const category = categoriesToSingleCategory({ categories });

  return [
    ...(category ? [at('category', setIfMissing(category))] : []),
    at('categories', unset()),
  ];
};

export default defineMigration({
  title: 'Move post categories[0] to a single category reference',
  documentTypes: ['blog_post'],
  migrate: {
    document(doc) {
      return moveCategoriesToSingleCategory(doc as TLegacyPostDoc);
    },
  },
});
