import { q } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';

// `^.slug.current` (GROQ's parent-scope operator) correlates each `blog_post`
// back to the enclosing `page_topic` document's own slug within this
// per-item projection — one round-trip for every topic page's slug, post
// count, and archive page size, no per-slug fan-out. Matching by slug (not
// `topic._ref`) mirrors `TOPIC_SCOPE_FILTER`, since `page_topic.slug` is
// seeded from `blog_topic.slug` unchanged.
export const topicPaginationParamsQuery = q.star
  .filterByType('page_topic')
  .project((sub) => ({
    slug: sub.field('slug.current').notNull(),
    postList: sub
      .field('postList')
      .deref()
      .project((archive) => ({
        pageSize: archive.field('pageSize').notNull(),
      }))
      .nullable(true),
    postCount: sub
      .count(
        sub.star
          .filterByType('blog_post')
          .filterRaw('topic->slug.current == ^.slug.current')
          .filterRaw(PUBLISHED_POST_FILTER),
      )
      .notNull(true),
  }));
