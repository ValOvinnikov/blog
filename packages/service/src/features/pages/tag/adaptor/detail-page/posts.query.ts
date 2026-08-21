import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { TAG_SCOPE_FILTER } from '@blog/service/shared/filters/tag-scope';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';

const tagPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw(TAG_SCOPE_FILTER)
  .filterRaw(PUBLISHED_POST_FILTER);

export function buildTagPostsPageQuery(start: number, end: number) {
  return q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: tagPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(archivePostCardFragment)
        .notNull(true),
      total: sub.count(tagPosts).notNull(true),
    }))
    .notNull(true);
}
