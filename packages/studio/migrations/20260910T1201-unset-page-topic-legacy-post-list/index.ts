/**
 * Unsets `page_topic`'s retired `postList` reference field, but only once a
 * document already carries the folded equivalent — a `modules[]` entry
 * whose `_ref` matches `postList._ref`. A document that hasn't been folded
 * yet is left untouched and reported to stderr instead, since unsetting its
 * only pointer to the list would destroy content with nothing to replace
 * it. Runs against both published and draft `page_topic` documents.
 *
 * Idempotency: the guard is content-based (module reference match), re-
 * checked on every run, so an already-unset document, or one that still
 * fails the guard, produces no patch on a repeat run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff, and the
 *      console warnings for any document the guard skipped
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: this must not run against a dataset until
 * the PR that folds `postList` into `modules[]` has already applied there
 * — the guard below is what makes that safe even if it hasn't.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

type TModuleItem = {
  _key?: string;
  _type?: string;
  _ref?: string;
};

type TLegacyTopicPageDoc = {
  _id: string;
  postList?: { _ref?: string };
  modules?: TModuleItem[];
};

const isFoldedIntoModules = (doc: TLegacyTopicPageDoc): boolean => {
  const postListRef = doc.postList?._ref;

  if (!postListRef) return true;

  return (doc.modules ?? []).some((item) => item._ref === postListRef);
};

export const isPageTopicTargetShapeReady = isFoldedIntoModules;

export const unsetLegacyPageTopicPostList = (doc: TLegacyTopicPageDoc) => {
  if (!isFoldedIntoModules(doc)) return undefined;
  if (doc.postList === undefined) return undefined;

  return [at('postList', unset())];
};

export default defineMigration({
  title: 'Unset legacy page_topic.postList field',
  documentTypes: ['page_topic'],
  migrate: {
    document(doc) {
      const page = doc as unknown as TLegacyTopicPageDoc;

      if (!isFoldedIntoModules(page)) {
        // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a guard-skipped document to the operator running the migration
        console.warn(
          `Skipping ${page._id}: modules[] has no member whose _ref matches postList._ref`,
        );
        return undefined;
      }

      return unsetLegacyPageTopicPostList(page);
    },
  },
});
