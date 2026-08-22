/**
 * Seeds a `page_topic` and its own `module_postList` for each existing
 * `blog_topic`, preserving today's `/topics/{slug}` URL by copying
 * `blog_topic.slug` onto the new `page_topic.slug` unchanged.
 * `blog_topic.slug` itself is left untouched — it stays live until
 * `page_topic.slug` is read instead.
 *
 * Anchor: `documentTypes: ['blog_topic']`, not `settings_site` — the same
 * choice the `module_taxonomyList`/`page_topicIndex` seed migration made.
 * This migration needs to read `blog_topic.slug` and `.title` for the
 * documents it creates, so anchoring on the type it must already fetch
 * avoids a second lookup — and `blog_topic` is exactly as guaranteed to
 * exist as `settings_site` for this migration's purpose: it's the input
 * data, so if it's absent there is nothing to seed and the migration
 * correctly visits zero documents.
 *
 * Every field is set explicitly — migrations write raw documents through the
 * API, so Studio `initialValue`/required-field defaults never fire.
 *
 * Idempotency guard: `createIfNotExists` is a no-op once each fixed id
 * already exists — there's no follow-up `patch`, so an editor's later edits
 * are never overwritten by a second run. Drafts are skipped so a
 * draft/published pair of the same topic doesn't emit the same creates twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 */
import { BRAND_VARIANT } from '@blog/config/constants';
import { createIfNotExists, defineMigration } from 'sanity/migrate';

import { toPageTopicId, toTopicPostListId } from './id';

const DRAFTS_PREFIX = 'drafts.';
const TOPIC_ITEMS_PER_PAGE = 9;

type TBlogTopicDoc = {
  _id: string;
  title?: string;
  slug?: { current?: string };
};

export default defineMigration({
  title: 'Seed page_topic and module_postList for the existing blog_topic',
  documentTypes: ['blog_topic'],

  migrate: {
    document(doc) {
      if (doc._id.startsWith(DRAFTS_PREFIX)) {
        return undefined;
      }

      const topic = doc as unknown as TBlogTopicDoc;
      const postListId = toTopicPostListId(topic._id);
      const pageTopicId = toPageTopicId(topic._id);

      return [
        createIfNotExists({
          _id: postListId,
          _type: 'module_postList',
          title: `${topic.title} Archive`,
          // Matches the topic archive's current unwrapped background (no
          // bg-* class in `blog-page-template-variants.ts`), so seeding this
          // required field doesn't visibly recolor the section once the
          // page starts rendering through `module_postList`.
          brandVariant: BRAND_VARIANT.PRIMARY,
          limit: TOPIC_ITEMS_PER_PAGE,
          pageSize: TOPIC_ITEMS_PER_PAGE,
        }),
        createIfNotExists({
          _id: pageTopicId,
          _type: 'page_topic',
          title: `${topic.title} Topic Page`,
          slug: topic.slug,
          topic: { _type: 'reference', _ref: topic._id },
          postList: { _type: 'reference', _ref: postListId },
        }),
      ];
    },
  },
});
