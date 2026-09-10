/**
 * Retires `blog_post`: deletes every `blog_post` document (published and
 * draft) and clears the leftover self-referential `post` field that the
 * `20260908T2227-absorb-blog-post-into-page-post` copy migration's dataset-
 * wide `_ref` rewrite left on `page_post`. Both run in the same pass so
 * these documents are touched once, not twice.
 *
 * Steps, per visited document:
 *   1. `blog_post` (published or draft): verify at run time, never trusting a
 *      prior check against a now-possibly-moved dataset, that its
 *      `page_post-<id>` counterpart exists with `content` set and nothing
 *      still references it (`assertBlogPostDeletable`, throws to abort the
 *      whole run otherwise), then `del` it.
 *   2. `page_post` still carrying a `post` field: `unset(['post'])`. Inert
 *      data (nothing reads it), but CI's advisory `Document validation` job
 *      reports it as a deprecated field on every PR.
 *
 * Idempotency: step 1 is a no-op on a re-run — a `blog_post` id already
 * deleted is never visited again. Step 2's guard is the presence of `post`
 * itself, so a document already unset is left alone.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this only after
 * `20260908T2227-absorb-blog-post-into-page-post` has already run against the
 * same dataset — that migration is what makes every `blog_post` safe to
 * delete.
 */
import {
  at,
  defineMigration,
  del,
  patch,
  unset,
  type Mutation,
} from 'sanity/migrate';

import { toPagePostId } from '../20260908T2227-absorb-blog-post-into-page-post/id';

import { assertBlogPostDeletable } from './precondition';

const BLOG_POST_TYPE = 'blog_post';
const PAGE_POST_TYPE = 'page_post';

type TRawDocument = { _id: string; _type: string; post?: unknown };

export default defineMigration({
  title: 'Retire blog_post: delete documents, unset page_post.post',
  documentTypes: [BLOG_POST_TYPE, PAGE_POST_TYPE],
  migrate: {
    async document(rawDoc, context) {
      const doc = rawDoc as unknown as TRawDocument;
      const mutations: Mutation[] = [];

      if (doc._type === BLOG_POST_TYPE) {
        const pagePostId = toPagePostId(doc._id);

        await assertBlogPostDeletable(context, doc._id, pagePostId);
        mutations.push(del(doc._id));
      }

      if (doc._type === PAGE_POST_TYPE && doc.post !== undefined) {
        mutations.push(patch(doc._id, [at('post', unset())]));
      }

      return mutations;
    },
  },
});
