/**
 * Expands `page_blog` for the new shape while the old fields stay live:
 * folds the legacy `postList` reference into `modules[]` as its first entry
 * (so the archive keeps rendering in the same position once `service`
 * starts reading `modules[]` instead of `postList`), and backfills
 * `headingBlock` from the legacy inline `heading` / `supportingText` so the
 * new field carries the same content the old ones did. Runs against both
 * published and draft `page_blog` documents.
 *
 * Idempotency guards, independent per field:
 *   - `modules[]` is left alone once it already holds a reference whose
 *     `_ref` matches `postList._ref` — checked by `_ref`, not position, so a
 *     document an editor has already reordered isn't re-inserted into.
 *   - `headingBlock` is left alone once it is already set, regardless of
 *     whether the legacy `heading` / `supportingText` fields are still
 *     present.
 * Tolerance: a document with no `postList` reference at all skips the
 * `modules[]` step without error — nothing to fold in. A document with
 * neither `heading` nor `supportingText` skips the `headingBlock` step the
 * same way.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * `service`/`web` code that reads `page_blog.modules[]` / `headingBlock`
 * instead of `postList` / `heading` / `supportingText`.
 */
import {
  at,
  defineMigration,
  prepend,
  set,
  setIfMissing,
} from 'sanity/migrate';

type TModuleReferenceItem = {
  _key: string;
  _type: string;
  _ref: string;
};

type TLegacyBlogPageDoc = {
  _id: string;
  heading?: string;
  supportingText?: string;
  postList?: { _ref?: string };
  modules?: TModuleReferenceItem[];
  headingBlock?: unknown;
};

const toPostListModuleKey = (postListRef: string): string =>
  `postList-${postListRef}`;

export const foldPostListIntoModules = (doc: TLegacyBlogPageDoc) => {
  const postListRef = doc.postList?._ref;

  if (!postListRef) return undefined;

  const alreadyReferenced = (doc.modules ?? []).some(
    (item) => item._ref === postListRef,
  );

  if (alreadyReferenced) return undefined;

  return [
    at('modules', setIfMissing([])),
    at(
      'modules',
      prepend([
        {
          _type: 'module_postList',
          _key: toPostListModuleKey(postListRef),
          _ref: postListRef,
        },
      ]),
    ),
  ];
};

const buildHeadingBlockValue = (
  doc: TLegacyBlogPageDoc,
): Record<string, unknown> => ({
  _type: 'headingBlock',
  ...(doc.heading !== undefined ? { heading: doc.heading } : {}),
  ...(doc.supportingText !== undefined
    ? { supportingText: doc.supportingText }
    : {}),
});

export const backfillHeadingBlock = (doc: TLegacyBlogPageDoc) => {
  if (doc.headingBlock !== undefined) return undefined;
  if (doc.heading === undefined && doc.supportingText === undefined) {
    return undefined;
  }

  return [at('headingBlock', set(buildHeadingBlockValue(doc)))];
};

export default defineMigration({
  title: 'Fold page_blog postList into modules[] and backfill headingBlock',
  documentTypes: ['page_blog'],

  migrate: {
    document(doc) {
      const page = doc as unknown as TLegacyBlogPageDoc;

      const mutations = [
        ...(foldPostListIntoModules(page) ?? []),
        ...(backfillHeadingBlock(page) ?? []),
      ];

      return mutations.length > 0 ? mutations : undefined;
    },
  },
});
