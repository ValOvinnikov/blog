/**
 * Retires `page_blog`: deletes the singleton document, published
 * (`page_blog`) and draft (`drafts.page_blog`).
 *
 * Steps, per visited document:
 *   1. Verify at run time, never trusting a prior check against a
 *      now-possibly-moved dataset, that its `page_postIndex` counterpart
 *      exists with a non-empty `modules` array and nothing still references
 *      the `page_blog` id (`assertPageBlogDeletable`, throws to abort the
 *      whole run otherwise).
 *   2. `del` it.
 *
 * Idempotency: a re-run is a no-op — a `page_blog` id already deleted is
 * never visited again.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this only after
 * `20260912T0709-copy-page-blog-to-page-post-index` has already run against
 * the same dataset — that migration is what makes every `page_blog`
 * reference and its content safe to drop.
 */
import { defineMigration, del, type Mutation } from 'sanity/migrate';

import {
  PAGE_BLOG_TO_POST_INDEX_ID_MAP,
  PAGE_BLOG_TYPE,
} from '../20260912T0709-copy-page-blog-to-page-post-index/ids';

import { assertPageBlogDeletable } from './precondition';

type TRawDocument = { _id: string; _type: string };

export default defineMigration({
  title: 'Retire page_blog: delete the singleton',
  documentTypes: [PAGE_BLOG_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const postIndexId = PAGE_BLOG_TO_POST_INDEX_ID_MAP.get(doc._id);

      if (!postIndexId) return [];

      await assertPageBlogDeletable(context, doc._id, postIndexId);

      const mutations: Mutation[] = [del(doc._id)];

      return mutations;
    },
  },
});
