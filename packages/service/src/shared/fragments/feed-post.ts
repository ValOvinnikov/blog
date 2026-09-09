import { q } from '@blog/service/sanity/query';
import { requiredHeadingBlockFragment } from '@blog/service/shared/fragments/heading-block';

/**
 * Deliberately leaner than `postCardFragment`/`archivePostCardFragment` — an
 * RSS entry only ever renders `title`/`slug`/`excerpt`/`publishedAt`, so this
 * fragment skips `author`, every image, `topic`, and `wordCount` entirely.
 */
export const feedPostFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    headingBlock: sub
      .field('headingBlock')
      .project(requiredHeadingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
