/**
 * Unsets `page_tag`'s retired `postList` field, but only once a document
 * has already moved onto the new shape — `modules[]` already containing a
 * member whose `_ref` matches `postList._ref`. A document that hasn't made
 * that move yet is left untouched and reported to stderr instead, since
 * unsetting its only list source would destroy content with nothing left
 * to replace it. Runs against both published and draft `page_tag`
 * documents.
 *
 * Idempotency: the fold guard and `postList`'s own presence are re-checked
 * on every run, so an already-unset document, or one that still fails the
 * guard, produces no patch on a repeat run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff, and the
 *      console warnings for any document the guard skipped
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: this must not run against a dataset until
 * `20260909T2200-fold-page-tag-post-list-into-modules` has already applied
 * there — the guard below is what makes that safe even if it hasn't.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TModuleItem = {
  _key?: string;
  _type?: string;
  _ref?: string;
};

type TLegacyTagPageDoc = {
  _id: string;
  postList?: { _ref?: string };
  modules?: TModuleItem[];
};

export const isPageTagPostListFolded = (doc: TLegacyTagPageDoc): boolean => {
  const postListRef = doc.postList?._ref;

  if (!postListRef) return false;

  return (doc.modules ?? []).some((module) => module._ref === postListRef);
};

export const unsetLegacyTagPageFields = (doc: TLegacyTagPageDoc) => {
  if (doc.postList === undefined) return undefined;

  if (!isPageTagPostListFolded(doc)) return undefined;

  return [at('postList', unset())];
};

export default defineMigration({
  title: 'Unset legacy page_tag postList field',
  documentTypes: ['page_tag'],
  migrate: {
    document(doc) {
      const page = doc as unknown as TLegacyTagPageDoc;

      if (page.postList !== undefined && !isPageTagPostListFolded(page)) {
        // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a guard-skipped document to the operator running the migration
        console.warn(
          `Skipping ${page._id}: modules[] has no member referencing postList._ref`,
        );
        return undefined;
      }

      return unsetLegacyTagPageFields(page);
    },
  },
});
