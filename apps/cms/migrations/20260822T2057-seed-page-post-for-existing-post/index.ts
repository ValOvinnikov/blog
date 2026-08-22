/**
 * Seeds a `page_post` for each existing `blog_post`, preserving today's
 * `/blog/{slug}` URL and publish date by copying `blog_post.slug` and
 * `.publishedAt` onto the new document unchanged. `blog_post.slug` and
 * `.publishedAt` are left untouched — they stay live until the
 * service/web layers move reads onto `page_post`.
 *
 * Anchor: `documentTypes: ['blog_post']`, not an unrelated always-present
 * type — this migration needs to read `blog_post.slug`, `.publishedAt`, and
 * `.title` for the documents it creates, so anchoring on the type it must
 * already fetch avoids a second lookup, and `blog_post` is exactly as
 * guaranteed to exist as any singleton for this migration's purpose: it's
 * the input data, so if it's absent there is nothing to seed and the
 * migration correctly visits zero documents.
 *
 * Every field is set explicitly — migrations write raw documents through the
 * API, so Studio `initialValue`/required-field defaults never fire.
 *
 * Idempotency guard: `createIfNotExists` is a no-op once each fixed id
 * already exists — there's no follow-up `patch`, so an editor's later edits
 * are never overwritten by a second run. Drafts are skipped so a
 * draft/published pair of the same post doesn't emit the same create twice.
 *
 * Workflow (see ../README.md for the full guardrails):
 *   1. `pnpm --filter cms dataset:export -- migrations/backups/production-<date>.tar.gz`
 *   2. `pnpm --filter cms migrate:dry` — inspect the diff
 *   3. `pnpm --filter cms migrate:run` — human-gated, mutates `production`
 */
import { createIfNotExists, defineMigration } from 'sanity/migrate';

import { toPagePostId } from './id';

const DRAFTS_PREFIX = 'drafts.';

type TBlogPostDoc = {
  _id: string;
  title?: string;
  slug?: { current?: string };
  publishedAt?: string;
};

export default defineMigration({
  title: 'Seed page_post for the existing blog_post',
  documentTypes: ['blog_post'],

  migrate: {
    document(doc) {
      if (doc._id.startsWith(DRAFTS_PREFIX)) {
        return undefined;
      }

      const post = doc as unknown as TBlogPostDoc;
      const pagePostId = toPagePostId(post._id);

      return [
        createIfNotExists({
          _id: pagePostId,
          _type: 'page_post',
          title: `${post.title} Post Page`,
          slug: post.slug,
          post: { _type: 'reference', _ref: post._id },
          publishedAt: post.publishedAt,
        }),
      ];
    },
  },
});
