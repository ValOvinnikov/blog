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

/**
 * Must stay in sync with `../../src/schema-types/objects/seo.ts`'s
 * `SEO_META_TITLE_MAX_LENGTH` — duplicated here rather than imported.
 * `sanity/migrate`'s Node loader cannot resolve that module's `sanity`
 * import chain (it bundles a `.css` asset), so any migration importing
 * from the Studio schema module fails every migration's `list`/`run`,
 * not just its own.
 */
const SEO_META_TITLE_MAX_LENGTH = 60;

/**
 * A fixed skeleton around the tag title clears the schema's metaTitle floor
 * regardless of how short the title is; only the ceiling needs clamping.
 */
export const buildTagMetaTitle = (tagTitle: string): string => {
  const title = `Browse every post tagged "${tagTitle}" on the blog`;

  return title.length > SEO_META_TITLE_MAX_LENGTH
    ? title.slice(0, SEO_META_TITLE_MAX_LENGTH).trimEnd()
    : title;
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
          showImages: true,
        }),
        createIfNotExists({
          _id: pageTagId,
          _type: 'page_tag',
          title: `${tag.title} Tag Page`,
          slug: tag.slug,
          tag: { _type: 'reference', _ref: tag._id },
          postList: { _type: 'reference', _ref: postListId },
          seo: {
            _type: 'seo',
            metaTitle: buildTagMetaTitle(tag.title ?? ''),
          },
        }),
      ];
    },
  },
});
