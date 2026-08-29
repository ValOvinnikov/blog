/**
 * Backfills `module_postList.title` and `.brandVariant` on any document
 * missing either — both are required on the schema
 * (`../../src/schema-types/modules/module-post-list.ts`), but a migration
 * writes raw documents directly, so Studio `initialValue` defaults never
 * fire. The seed migration that first created `postList-blog`
 * (`../20260821T0900-seed-page-blog-post-list`) only set `pageSize`/`limit`,
 * leaving both required fields empty.
 *
 * Matches on the missing fields rather than a hardcoded document id, so this
 * also covers `production` (which hasn't run the seed migration yet) in the
 * same pass, and re-running it after the seed migration completes there is a
 * no-op.
 *
 * Idempotency guard: only writes a field that is currently missing
 * (`undefined`/`null`) — a value an editor has already filled in, on this or
 * any other `module_postList` document, is never touched.
 */
import { BRAND_VARIANT } from '@blog/config/constants';
import { at, defineMigration, set } from 'sanity/migrate';

type TPostListDoc = {
  title?: string | null;
  brandVariant?: string | null;
};

const BACKFILL_TITLE = 'Blog Archive';

/**
 * Matches the `/blog` archive's current unwrapped background
 * (`--color-primary`, the page-background token — see
 * `configs/tailwind/theme.css`), so backfilling this required field doesn't
 * visibly recolor the section once the archive starts rendering through
 * `module_postList`.
 */
const BACKFILL_BRAND_VARIANT = BRAND_VARIANT.PRIMARY;

const isMissing = (value: string | null | undefined): boolean =>
  value === undefined || value === null;

/**
 * Pure transform: fills `title`/`brandVariant` only where each is currently
 * missing. Exported so it's unit-testable without the Sanity migration runner.
 */
export const backfillPostListRequiredFields = (doc: TPostListDoc) => {
  const ops = [];

  if (isMissing(doc.title)) {
    ops.push(at('title', set(BACKFILL_TITLE)));
  }
  if (isMissing(doc.brandVariant)) {
    ops.push(at('brandVariant', set(BACKFILL_BRAND_VARIANT)));
  }

  return ops.length > 0 ? ops : undefined;
};

export default defineMigration({
  title: 'Backfill module_postList required title/brandVariant fields',
  documentTypes: ['module_postList'],
  migrate: {
    document(doc) {
      return backfillPostListRequiredFields(doc as TPostListDoc);
    },
  },
});
