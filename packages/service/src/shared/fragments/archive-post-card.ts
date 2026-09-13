import { q } from '@blog/service/sanity/query';
import { headingBlockFragment } from '@blog/service/shared/fragments/heading-block';

import { topicFragment } from './topic';
import { WORD_COUNT_EXPRESSION, wordCountParser } from './word-count';

/**
 * Archive-listing cards render text-only, so this fragment omits
 * `heroImage`/`featured`/`author`. `wordCount` is computed server-side (see
 * `word-count.ts`) rather than fetched from `body`.
 */
export const archivePostCardFragment = q
  .fragmentForType<'page_post'>()
  .project((sub) => ({
    _id: true,
    headingBlock: sub
      .field('headingBlock')
      .project(headingBlockFragment)
      .notNull(),
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    topic: sub.field('topic').deref().project(topicFragment).notNull(),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
