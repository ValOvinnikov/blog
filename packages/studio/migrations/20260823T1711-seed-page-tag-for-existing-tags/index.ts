/**
 * Seeds a `page_tag` and its own `module_postList` for each of the 15
 * existing `blog_tag` documents, preserving today's `/tags/{slug}` URL by
 * copying `blog_tag.slug` onto the new `page_tag.slug` unchanged.
 * `blog_tag.slug` itself is left untouched — it stays live until
 * `page_tag.slug` is read instead.
 *
 * Anchor: `documentTypes: ['blog_tag']`, not `settings_site` — the same
 * choice the `blog_topic` per-topic seed migration made. This migration
 * needs to read `blog_tag.slug` and `.title` for the documents it creates,
 * so anchoring on the type it must already fetch avoids a second lookup —
 * and `blog_tag` is exactly as guaranteed to exist as `settings_site` for
 * this migration's purpose: it's the input data, so if it's absent there is
 * nothing to seed and the migration correctly visits zero documents.
 * `document(doc)` fires once per matching document, so all 15 tags are
 * handled without any extra loop logic.
 *
 * Every field is set explicitly — migrations write raw documents through the
 * API, so Studio `initialValue`/required-field defaults never fire.
 *
 * Idempotency guard: `createIfNotExists` is a no-op once each fixed id
 * already exists — there's no follow-up `patch`, so an editor's later edits
 * are never overwritten by a second run. Drafts are skipped so a
 * draft/published pair of the same tag doesn't emit the same creates twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter @blog/studio dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter @blog/studio migrate:dry` — inspect the diff
 *   3. `pnpm --filter @blog/studio migrate:run` — human-gated, mutates `production`
 */
import { BRAND_VARIANT } from '@blog/config/constants';
import { createIfNotExists, defineMigration } from 'sanity/migrate';

import { toPageTagId, toTagPostListId } from './id';

const DRAFTS_PREFIX = 'drafts.';
const TAG_ITEMS_PER_PAGE = 9;

type TBlogTagDoc = {
  _id: string;
  title?: string;
  slug?: { current?: string };
};

export default defineMigration({
  title: 'Seed page_tag and module_postList for the existing blog_tag',
  documentTypes: ['blog_tag'],

  migrate: {
    document(doc) {
      if (doc._id.startsWith(DRAFTS_PREFIX)) {
        return undefined;
      }

      const tag = doc as unknown as TBlogTagDoc;
      const postListId = toTagPostListId(tag._id);
      const pageTagId = toPageTagId(tag._id);

      return [
        createIfNotExists({
          _id: postListId,
          _type: 'module_postList',
          title: `${tag.title} Archive`,
          brandVariant: BRAND_VARIANT.SECONDARY,
          limit: TAG_ITEMS_PER_PAGE,
          pageSize: TAG_ITEMS_PER_PAGE,
        }),
        createIfNotExists({
          _id: pageTagId,
          _type: 'page_tag',
          title: `${tag.title} Tag Page`,
          slug: tag.slug,
          tag: { _type: 'reference', _ref: tag._id },
          postList: { _type: 'reference', _ref: postListId },
        }),
      ];
    },
  },
});
