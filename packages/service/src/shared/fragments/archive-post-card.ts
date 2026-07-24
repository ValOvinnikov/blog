import { q } from '@blog/service/sanity/query';

import { categoryFragment } from './category';
import { WORD_COUNT_EXPRESSION, wordCountParser } from './word-count';

/**
 * Archive-listing cards render text-only (decision #624) — unlike
 * `postCardFragment`, which the post-detail "related posts" feature still
 * needs in full, this fragment skips `heroImage`/`featured`/`author`
 * entirely rather than fetching fields no archive card renders. `wordCount`
 * is computed server-side (see `word-count.ts`) rather than fetching `body`,
 * for the same reason.
 */
export const archivePostCardFragment = q
  .fragmentForType<'blog_post'>()
  .project((sub) => ({
    _id: true,
    title: sub.field('title').notNull(),
    slug: sub.field('slug.current').notNull(),
    excerpt: sub.field('excerpt').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
    category: sub.field('category').deref().project(categoryFragment).notNull(),
    wordCount: sub.raw(WORD_COUNT_EXPRESSION, wordCountParser),
  }));
