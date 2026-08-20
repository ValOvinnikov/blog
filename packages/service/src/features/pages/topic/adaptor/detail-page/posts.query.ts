import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { TOPIC_SCOPE_FILTER } from '@blog/service/shared/filters/topic-scope';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';

const topicPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw(TOPIC_SCOPE_FILTER)
  .filterRaw(PUBLISHED_POST_FILTER);

export const buildTopicPostsPageQuery = (start: number, end: number) =>
  q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: topicPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(archivePostCardFragment)
        .notNull(true),
      total: sub.count(topicPosts).notNull(true),
    }))
    .notNull(true);
