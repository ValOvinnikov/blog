/**
 * Unsets the retired `page_blog.itemsPerPage` and `module_postList.limit`
 * fields, orphaned when the post-list module split into a paginated
 * `module_postList` (governed by `pageSize`) and a teaser
 * `module_postLatest` (with its own, still-live `limit`).
 *
 * Timestamped after `20260821T0900-seed-page-blog-post-list`, which still
 * reads `page_blog.itemsPerPage` as document data on any dataset where it
 * hasn't yet applied — running this migration first would strip that input
 * out from under it.
 *
 * Idempotency guard: skips a document whose retired field is already
 * absent — already-migrated or never-set either way.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TPageBlogDoc = {
  itemsPerPage?: unknown;
};

type TPostListDoc = {
  limit?: unknown;
};

/**
 * Pure transform: unsets whichever retired field applies to this document's
 * type. Exported so it's unit-testable without the Sanity migration runner.
 */
export const removeRetiredPostListLimitFields = (
  type: string,
  doc: TPageBlogDoc & TPostListDoc,
) => {
  if (type === 'page_blog') {
    if (doc.itemsPerPage === undefined) return undefined;
    return [at('itemsPerPage', unset())];
  }

  if (doc.limit === undefined) return undefined;
  return [at('limit', unset())];
};

export default defineMigration({
  title:
    'Remove retired page_blog.itemsPerPage and module_postList.limit fields',
  documentTypes: ['page_blog', 'module_postList'],
  migrate: {
    document(doc) {
      return removeRetiredPostListLimitFields(
        doc._type,
        doc as unknown as TPageBlogDoc & TPostListDoc,
      );
    },
  },
});
