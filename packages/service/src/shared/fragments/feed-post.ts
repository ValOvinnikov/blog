import { q } from '@blog/service/sanity/query';
import { requiredSectionHeaderFragment } from '@blog/service/shared/fragments/section-header';

/**
 * Deliberately leaner than `postCardFragment`/`archivePostCardFragment` — an
 * RSS entry only ever renders `title`/`slug`/`excerpt`/`publishedAt`, so this
 * fragment skips `author`, every image, `topic`, and `wordCount` entirely.
 */
export const feedPostFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .nullable(true),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
