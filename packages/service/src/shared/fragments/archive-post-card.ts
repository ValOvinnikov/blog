import { q } from '@blog/service/sanity/query';
import { requiredSectionHeaderFragment } from '@blog/service/shared/fragments/section-header';

import { topicFragment } from './topic';
import { WORD_COUNT_EXPRESSION, wordCountParser } from './word-count';

/**
 * Archive-listing cards render text-only — unlike
 * `postCardFragment`, which the post-detail "related posts" feature still
 * needs in full, this fragment skips `heroImage`/`featured`/`author`
 * entirely rather than fetching fields no archive card renders. `wordCount`
 * is computed server-side (see `word-count.ts`) rather than fetching `body`,
 * for the same reason.
 */
export const archivePostCardFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    sectionHeader: sub
      .field('sectionHeader')
      .project(requiredSectionHeaderFragment)
      .nullable(true),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    topic: sub.field('topic').deref().project(topicFragment).nullable(true),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
