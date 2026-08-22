import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

// Resolves by `page_post`'s own `slug`/`publishedAt` — the page-level
// source of truth for the rendered route — not `blog_post`'s, which can
// drift from it (mirrors `getTopicParams`'s move onto `page_topic.slug`).
export const postParamsQuery = q.star
  .filterByType('page_post')
  .filterRaw(PUBLISHED_POST_FILTER)
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    publishedAt: sub.field('publishedAt').notNull(),
  }));
