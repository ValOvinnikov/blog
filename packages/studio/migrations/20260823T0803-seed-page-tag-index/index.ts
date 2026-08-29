/**
 * Seeds a `module_taxonomyList` and the `page_tagIndex` singleton that
 * references it — both fixed-id documents, neither of which exists in any
 * dataset yet, and no `/tags` route reads them yet either.
 *
 * Anchor: `documentTypes: ['settings_site']`. Neither target document exists
 * yet, so a migration declared against either of their own types would
 * iterate zero documents and never fire — a silent no-op that reads exactly
 * like "already applied" in `migrate:dry`. `settings_site` is anchored on
 * instead because it's guaranteed to already exist everywhere this can run:
 * every live blog dataset needs it to render at all, and it's part of the
 * fixed starter-content template every freshly provisioned tenant is seeded
 * with (`packages/db/scripts/provision-tenant/steps/starter-content.ts`).
 * If a dataset genuinely has no `settings_site` document, the handler simply
 * never fires — visibly nothing in the dry-run diff, never a half-created
 * `page_tagIndex` with a dangling `taxonomyList` reference.
 *
 * Every field is set explicitly — migrations write raw documents through the
 * API, so Studio `initialValue`/required-field prompts never fire the way
 * they would for an editor filling in the create form.
 *
 * Idempotency guard: `createIfNotExists` is a no-op once each fixed id
 * already exists — there's no follow-up `patch`, so a document an editor has
 * since edited is never overwritten by a second run. Only fires once per
 * dataset (skips `drafts.settings_site`) so a draft/published pair of the
 * anchor doesn't emit the same create mutations twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 *
 * Deploy-ordering constraint: run this against a dataset before deploying
 * web code that renders `/tags` from `page_tagIndex`, so there's no window
 * where that code finds neither document.
 */
import { BRAND_VARIANT } from '@blog/config/constants';
import { createIfNotExists, defineMigration } from 'sanity/migrate';

import { PAGE_TAG_INDEX_ID, TAXONOMY_LIST_TAGS_ID } from './ids';

const DRAFTS_PREFIX = 'drafts.';

type TAnchorDoc = { _id: string };

export default defineMigration({
  title: 'Seed module_taxonomyList and page_tagIndex for /tags',
  documentTypes: ['settings_site'],

  migrate: {
    document(doc) {
      const anchor = doc as unknown as TAnchorDoc;

      if (anchor._id.startsWith(DRAFTS_PREFIX)) {
        return undefined;
      }

      return [
        createIfNotExists({
          _id: TAXONOMY_LIST_TAGS_ID,
          _type: 'module_taxonomyList',
          title: 'Tag Index List',
          // /topics has no equivalent /tags page to visually match yet, so
          // this is a deliberate choice rather than a copy of PRIMARY:
          // SECONDARY distinguishes /tags from /topics, two routes built
          // from the same page template and module, so they don't read as
          // the same page when navigating between them.
          brandVariant: BRAND_VARIANT.SECONDARY,
        }),
        createIfNotExists({
          _id: PAGE_TAG_INDEX_ID,
          _type: 'page_tagIndex',
          title: 'Tag Index Page',
          heading: 'Tags',
          supportingText: 'Browse every post by tag.',
          taxonomyList: {
            _type: 'reference',
            _ref: TAXONOMY_LIST_TAGS_ID,
          },
        }),
      ];
    },
  },
});
