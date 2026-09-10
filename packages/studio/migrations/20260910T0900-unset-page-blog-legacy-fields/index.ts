/**
 * Unsets `page_blog`'s retired `heading`, `supportingText` and `postList`
 * fields, but only once a document has already moved onto the new shape —
 * a `modules[]` entry referencing `module_postList` and a set
 * `headingBlock.heading`. A document that hasn't made that move yet is left
 * untouched and reported to stderr instead, since unsetting its only
 * heading/list source would destroy content with nothing to replace it.
 * Runs against both published and draft `page_blog` documents.
 *
 * Idempotency: the target-shape guard and each field's presence are
 * re-checked on every run, so an already-migrated document, or one that
 * still fails the guard, produces no patch on a repeat run.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff, and the
 *      console warnings for any document the guard skipped
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: this must not run against a dataset until
 * `20260909T2010-fold-page-blog-post-list-into-modules` has already applied
 * there — the guard below is what makes that safe even if it hasn't.
 */
import { at, defineMigration, unset } from 'sanity/migrate';

const MODULE_POST_LIST_TYPE = 'module_postList';

type TModuleItem = {
  _key?: string;
  _type?: string;
  _ref?: string;
};

type TLegacyBlogPageDoc = {
  _id: string;
  heading?: unknown;
  supportingText?: unknown;
  postList?: unknown;
  modules?: TModuleItem[];
  headingBlock?: {
    heading?: string;
  };
};

const hasPostListModule = (doc: TLegacyBlogPageDoc): boolean =>
  (doc.modules ?? []).some((item) => item._type === MODULE_POST_LIST_TYPE);

const hasHeadingBlockHeading = (doc: TLegacyBlogPageDoc): boolean =>
  (doc.headingBlock?.heading ?? '').trim().length > 0;

export const isPageBlogTargetShapeReady = (doc: TLegacyBlogPageDoc): boolean =>
  hasPostListModule(doc) && hasHeadingBlockHeading(doc);

export const unsetLegacyBlogPageFields = (doc: TLegacyBlogPageDoc) => {
  if (!isPageBlogTargetShapeReady(doc)) return undefined;

  const patches = [
    ...(doc.heading !== undefined ? [at('heading', unset())] : []),
    ...(doc.supportingText !== undefined
      ? [at('supportingText', unset())]
      : []),
    ...(doc.postList !== undefined ? [at('postList', unset())] : []),
  ];

  return patches.length > 0 ? patches : undefined;
};

export default defineMigration({
  title: 'Unset legacy page_blog heading/supportingText/postList fields',
  documentTypes: ['page_blog'],
  migrate: {
    document(doc) {
      const page = doc as unknown as TLegacyBlogPageDoc;

      if (!isPageBlogTargetShapeReady(page)) {
        // eslint-disable-next-line no-console -- migrate:dry/migrate:run have no other channel to surface a guard-skipped document to the operator running the migration
        console.warn(
          `Skipping ${page._id}: modules[] has no module_postList reference and/or headingBlock.heading is unset`,
        );
        return undefined;
      }

      return unsetLegacyBlogPageFields(page);
    },
  },
});
