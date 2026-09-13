/**
 * Copies the `page_blog` singleton's content onto its `page_postIndex`
 * counterpart and rewrites every dataset reference from a `page_blog` id to
 * the matching `page_postIndex` id. `page_blog` is read from, never deleted,
 * here — a Sanity `_type` is immutable, so retiring `page_blog` is its own
 * later migration.
 *
 * Anchor: no `documentTypes` filter — the reference rewrite in step 2 has to
 * see every document in the dataset, not just `page_blog`.
 *
 * Steps, per visited document:
 *   1. If it's `page_blog` (published `page_blog` or draft `drafts.page_blog`),
 *      `createOrReplace` the matching `page_postIndex` / `drafts.page_postIndex`
 *      with `title`, `headingBlock`, `hero`, `modules` and `seo` copied over.
 *      `modules` holds references to shared module documents, so those
 *      documents themselves are not duplicated — only the referencing array
 *      is copied (with any `page_blog`-pointing `_ref` inside it rewritten,
 *      see `rewrite-refs.ts`).
 *   2. Regardless of type, rewrite any `_ref` anywhere in the document that
 *      matches `page_blog`/`drafts.page_blog` to its `page_postIndex`/
 *      `drafts.page_postIndex` id (see `rewrite-refs.ts`).
 *
 * Idempotency: step 1 recomputes the same `page_postIndex` fields from the
 * same `page_blog` source data every run (a stable function of its inputs,
 * not a one-time flag), and step 2 finds nothing left to rewrite once every
 * reference already points at its `page_postIndex` id.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * code that reads `page_postIndex` instead of `page_blog`, so there's no
 * window where that code finds neither document.
 */
import {
  createOrReplace,
  defineMigration,
  type Mutation,
} from 'sanity/migrate';

import {
  rewriteRefsDeep,
  collectRefRewritePatches,
} from '../20260908T2227-absorb-blog-post-into-page-post/rewrite-refs';

import {
  PAGE_BLOG_TO_POST_INDEX_ID_MAP,
  PAGE_BLOG_TYPE,
  PAGE_POST_INDEX_TYPE,
} from './ids';

type TRawDocument = { _id: string; _type: string; [key: string]: unknown };

type TPageBlogDoc = {
  _id: string;
  title?: unknown;
  headingBlock?: unknown;
  hero?: unknown;
  modules?: unknown;
  seo?: unknown;
};

export default defineMigration({
  title: 'Copy page_blog into page_postIndex and rewrite references',
  migrate: {
    document(rawDoc) {
      const doc = rawDoc as unknown as TRawDocument;
      const mutations: Mutation[] = [];

      if (doc._type === PAGE_BLOG_TYPE) {
        const page = doc as unknown as TPageBlogDoc;
        const targetId = PAGE_BLOG_TO_POST_INDEX_ID_MAP.get(page._id);

        if (targetId) {
          const fields = rewriteRefsDeep(
            {
              title: page.title,
              headingBlock: page.headingBlock,
              hero: page.hero,
              modules: page.modules,
              seo: page.seo,
            },
            PAGE_BLOG_TO_POST_INDEX_ID_MAP,
          );

          mutations.push(
            createOrReplace({
              _id: targetId,
              _type: PAGE_POST_INDEX_TYPE,
              ...fields,
            }),
          );
        }
      }

      const refRewrite = collectRefRewritePatches(
        doc,
        PAGE_BLOG_TO_POST_INDEX_ID_MAP,
      );

      if (refRewrite) mutations.push(refRewrite);

      return mutations;
    },
  },
});
