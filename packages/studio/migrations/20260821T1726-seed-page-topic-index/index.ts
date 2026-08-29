/**
 * Seeds a `module_taxonomyList` and the `page_topicIndex` singleton that
 * references it — both fixed-id documents, neither of which exists in any
 * dataset yet, so `/topics` renders unchanged (currently static i18n copy)
 * once code starts reading them.
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
 * `page_topicIndex` with a dangling `taxonomyList` reference.
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
 * web code that renders `/topics` from `page_topicIndex` instead of its
 * current static i18n copy, so there's no window where that code finds
 * neither document.
 */
import { BRAND_VARIANT } from '@blog/config/constants';
import { createIfNotExists, defineMigration } from 'sanity/migrate';

import { PAGE_TOPIC_INDEX_ID, TAXONOMY_LIST_TOPICS_ID } from './ids';

const DRAFTS_PREFIX = 'drafts.';

type TAnchorDoc = { _id: string };

export default defineMigration({
  title: 'Seed module_taxonomyList and page_topicIndex for /topics',
  documentTypes: ['settings_site'],

  migrate: {
    document(doc) {
      const anchor = doc as unknown as TAnchorDoc;

      if (anchor._id.startsWith(DRAFTS_PREFIX)) {
        return undefined;
      }

      return [
        createIfNotExists({
          _id: TAXONOMY_LIST_TOPICS_ID,
          _type: 'module_taxonomyList',
          title: 'Topic Index List',
          // Matches the /topics page's current unwrapped background
          // (no bg-* class in `topics-page-variants.ts`), so seeding this
          // required field doesn't visibly recolor the section once the
          // page starts rendering through `module_taxonomyList`.
          brandVariant: BRAND_VARIANT.PRIMARY,
        }),
        createIfNotExists({
          _id: PAGE_TOPIC_INDEX_ID,
          _type: 'page_topicIndex',
          title: 'Topic Index Page',
          heading: 'Topics',
          supportingText: 'Browse every post by topic.',
          taxonomyList: {
            _type: 'reference',
            _ref: TAXONOMY_LIST_TOPICS_ID,
          },
        }),
      ];
    },
  },
});
