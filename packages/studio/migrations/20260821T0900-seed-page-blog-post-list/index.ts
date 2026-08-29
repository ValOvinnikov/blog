/**
 * Seeds a `module_postList` document under a fixed id and sets
 * `page_blog.postList` to reference it, carrying `pageSize`/`limit` over
 * from the live `page_blog.itemsPerPage` value so the archive's page size
 * doesn't change when the reference starts being read.
 *
 * Idempotency guard: skips once `page_blog.postList` is already set — the
 * target shape, not the presence of `itemsPerPage` (which stays on the
 * schema and is left untouched either way).
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against `production` before any
 * change that starts reading `page_blog.postList` instead of `itemsPerPage`.
 */
import {
  at,
  createIfNotExists,
  defineMigration,
  patch,
  set,
} from 'sanity/migrate';

import { toBlogPostListId } from './id';

type TPageBlogDoc = {
  _id: string;
  itemsPerPage?: number;
  postList?: { _ref?: string };
};

export default defineMigration({
  title: 'Seed a module_postList for page_blog and set page_blog.postList',
  documentTypes: ['page_blog'],

  migrate: {
    document(doc) {
      const page = doc as unknown as TPageBlogDoc;

      if (page.postList) {
        return undefined;
      }

      const postListId = toBlogPostListId(page._id);

      return [
        createIfNotExists({
          _id: postListId,
          _type: 'module_postList',
          pageSize: page.itemsPerPage,
          limit: page.itemsPerPage,
        }),
        patch(page._id, [
          at('postList', set({ _type: 'reference', _ref: postListId })),
        ]),
      ];
    },
  },
});
