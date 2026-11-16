import { q } from '@shinefold/service/sanity/query/query';
import { pageHeadingBlockFragment } from '@shinefold/service/shared/fragments/heading-block/page-heading-block';

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
      .project(pageHeadingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
