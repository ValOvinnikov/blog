import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block/heading-block';

/**
 * Deliberately leaner than `postCardFragment` — an RSS entry only ever
 * renders `title`/`slug`/`excerpt`/`publishedAt`, so this fragment skips
 * `author`, every image, `topic`, and `wordCount` entirely.
 */
export const postFeedFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
