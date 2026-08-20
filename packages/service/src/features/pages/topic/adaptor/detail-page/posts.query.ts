import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';

// `topic` is a single dereferenced reference (like `author`), so this is
// now a direct equality check through the reference — no `in`-operator
// needed. `filterBy`'s strong typing only covers paths on the raw
// (undereferenced) document shape, so a dereferenced path like
// `topic->slug.current` still goes through `filterRaw`.
const topicPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('topic->slug.current == $slug')
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
