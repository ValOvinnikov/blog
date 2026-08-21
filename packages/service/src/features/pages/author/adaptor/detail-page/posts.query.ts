import { q, type TSlugParams } from '@blog/service/sanity/query';
import { PUBLISHED_POST_FILTER } from '@blog/service/shared/filters/published-post';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';

// `author` is a single dereferenced reference, so the filter is a direct
// equality check through the reference — no `in`-operator needed.
// `filterBy`'s strong typing only covers paths on the raw (undereferenced)
// document shape, so a dereferenced path like `author->slug.current` still
// goes through `filterRaw`.
const authorPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('author->slug.current == $slug')
  .filterRaw(PUBLISHED_POST_FILTER);

export function buildAuthorPostsPageQuery(start: number, end: number) {
  return q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: authorPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(archivePostCardFragment)
        .notNull(true),
      total: sub.count(authorPosts).notNull(true),
    }))
    .notNull(true);
}
