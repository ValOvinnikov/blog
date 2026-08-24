import { q } from '@blog/service/sanity/query';

/**
 * Deliberately leaner than `postCardFragment`/`archivePostCardFragment` — an
 * RSS entry only ever renders `title`/`slug`/`excerpt`/`publishedAt`, so this
 * fragment skips `author`, every image, `topic`, and `wordCount` entirely.
 */
export const feedPostFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
