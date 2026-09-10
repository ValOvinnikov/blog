/**
 * Folds `page_topic.postList` and `page_tag.postList` into `modules[]` as a
 * `module_postList` reference at index 0, and unsets the legacy `postList`
 * field in the same pass, on both published and draft documents.
 *
 * Guardrails:
 *   - A document with no `postList` reference is a no-op, not an error.
 *   - A document whose `modules[]` already contains a reference matching
 *     `postList._ref` is left untouched — idempotent re-run.
 *   - `postList` is only unset on a document folded in this same pass; a
 *     skipped document keeps it.
 *
 * The inserted array item's `_key` is derived deterministically from
 * `postList._ref` (see
 * `../20260909T2100-fold-page-topic-post-list-into-modules/module-key.ts`),
 * so a re-run computes the exact same key rather than a fresh random one.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import {
  at,
  defineMigration,
  prepend,
  setIfMissing,
  unset,
} from 'sanity/migrate';

import { toPostListModuleKey } from '../20260909T2100-fold-page-topic-post-list-into-modules/module-key';

const POST_LIST_MODULE_TYPE = 'module_postList';

type TModuleReferenceItem = {
  _key: string;
  _type: string;
  _ref: string;
};

export type TFoldableDoc = {
  postList?: { _ref?: string };
  modules?: TModuleReferenceItem[];
};

export const refoldPostListIntoModules = (doc: TFoldableDoc) => {
  const postListRef = doc.postList?._ref;

  if (!postListRef) return undefined;

  const alreadyFolded = (doc.modules ?? []).some(
    (module) => module._ref === postListRef,
  );

  if (alreadyFolded) return undefined;

  return [
    at('modules', setIfMissing([])),
    at(
      'modules',
      prepend([
        {
          _key: toPostListModuleKey(postListRef),
          _type: POST_LIST_MODULE_TYPE,
          _ref: postListRef,
        },
      ]),
    ),
    at('postList', unset()),
  ];
};

export default defineMigration({
  title: 'Re-fold page_topic/page_tag postList into modules[]',
  documentTypes: ['page_topic', 'page_tag'],
  migrate: {
    document(doc) {
      return refoldPostListIntoModules(doc as unknown as TFoldableDoc);
    },
  },
});
