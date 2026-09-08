import { q } from '@blog/service/sanity/query';
import {
  POST_CONTENT_READY_FILTER,
  PUBLISHED_POST_FILTER,
} from '@blog/service/shared/filters/published-post';
import { topicFragment } from '@blog/service/shared/fragments/topic';

export const topicsQuery = q.star
  .filterByType('blog_topic')
  .order('title asc')
  .project((sub) => ({
    ...topicFragment,
    // `perspective: 'published'` (sanity/client.ts) already excludes drafts,
    // so a plain reference count plus `PUBLISHED_POST_FILTER` (excluding
    // future-dated posts) is the published-post count. `^._id` (GROQ's
    // parent-scope operator) correlates each `page_post` back to the
    // enclosing topic document within this per-item projection.
    postCount: sub
      .count(
        sub.star
          .filterByType('page_post')
          .filterRaw('references(^._id)')
          .filterRaw(PUBLISHED_POST_FILTER)
          .filterRaw(POST_CONTENT_READY_FILTER),
      )
      .notNull(true),
  }));
