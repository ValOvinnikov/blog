/**
 * Backfills `blog_post.newsletterEnabled` to `true` on every existing post
 * (#1198, part of the newsletter placement redo — epic #1197). The field is
 * new and defaults `initialValue: true` for posts created going forward
 * (`../../src/schema-types/documents/blog/post.ts`), but `initialValue` only
 * applies in the Studio create form — it never touches documents that
 * already exist in the dataset, so every pre-existing post would otherwise
 * read as `undefined` (falsy) and silently opt out of the newsletter signup
 * that's supposed to be on by default.
 *
 * Idempotency guard: skips documents where `newsletterEnabled` (the *target*
 * field) is already present — regardless of its value — so a post an editor
 * has already flipped to `false` (or one already migrated to `true`) is never
 * clobbered by a second run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` *before*
 * deploying web code that reads `newsletterEnabled` to decide whether to
 * render the per-post newsletter signup, so there is no window where live
 * posts read as opted-out for code that expects the field to be populated.
 */
import { at, defineMigration, set } from 'sanity/migrate';

/** The shape of a `blog_post` document that may not yet carry the new field. */
type TPostDoc = { newsletterEnabled?: boolean };

/**
 * Pure transform: sets `newsletterEnabled: true` on a post that doesn't
 * already have the field. Exported so it's unit-testable without the Sanity
 * migration runner.
 */
export const backfillNewsletterEnabled = (doc: TPostDoc) => {
  // Idempotency: target field already present (true or false) — leave it alone.
  if (doc.newsletterEnabled !== undefined) return undefined;

  return [at('newsletterEnabled', set(true))];
};

export default defineMigration({
  title: 'Backfill post newsletterEnabled to true',
  documentTypes: ['blog_post'],
  migrate: {
    document(doc) {
      return backfillNewsletterEnabled(doc as TPostDoc);
    },
  },
});
