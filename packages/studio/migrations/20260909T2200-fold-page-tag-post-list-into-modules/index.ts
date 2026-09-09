/**
 * Folds `page_tag.postList` into `modules[]` as a `module_postList`
 * reference at index 0, on both published and draft documents — the
 * expand half of retiring the dedicated `postList` field (the field itself
 * stays on the schema, `readOnly` + `deprecated`, until a follow-up
 * migration unsets it once every environment has migrated).
 *
 * Idempotency guard: skips a document once `modules[]` already contains a
 * reference whose `_ref` matches `postList._ref` — regardless of whether
 * the legacy `postList` field is still populated, so a document that
 * transiently carries both shapes is never re-inserted. A document with no
 * `postList` reference is also a no-op, not an error.
 *
 * The inserted array item's `_key` is derived deterministically from
 * `postList._ref` (see `./module-key.ts`), so a re-run computes the exact
 * same key rather than a fresh random one.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset *before* deploying
 * service/web code that reads the post list from `modules[]` instead of the
 * dedicated `postList` field, so there is no window where a live document
 * has neither shape populated for the code currently reading it.
 */
import { at, defineMigration, prepend } from 'sanity/migrate';

import { toPostListModuleKey } from './module-key';

const POST_LIST_MODULE_TYPE = 'module_postList';

type TModuleReferenceItem = {
  _key: string;
  _type: string;
  _ref: string;
};

export type TPageTagDoc = {
  postList?: { _ref?: string };
  modules?: TModuleReferenceItem[];
};

export const foldPostListIntoModules = (doc: TPageTagDoc) => {
  const postListRef = doc.postList?._ref;

  if (!postListRef) return undefined;

  const alreadyFolded = (doc.modules ?? []).some(
    (module) => module._ref === postListRef,
  );

  if (alreadyFolded) return undefined;

  return [
    at(
      'modules',
      prepend({
        _key: toPostListModuleKey(postListRef),
        _type: POST_LIST_MODULE_TYPE,
        _ref: postListRef,
      }),
    ),
  ];
};

export default defineMigration({
  title: 'Fold page_tag.postList into modules[]',
  documentTypes: ['page_tag'],
  migrate: {
    document(doc) {
      return foldPostListIntoModules(doc as unknown as TPageTagDoc);
    },
  },
});
