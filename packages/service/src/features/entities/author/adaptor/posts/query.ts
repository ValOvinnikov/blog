import { q, type TSlugParams } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

// `author` is a single dereferenced reference (unlike the array-of-references
// `categories`), so the filter is a direct equality check through the
// reference — no `in`-operator needed. `filterBy`'s strong typing only covers
// paths on the raw (undereferenced) document shape, so a dereferenced path
// like `author->slug.current` still goes through `filterRaw`.
const authorPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('author->slug.current == $slug');

export const buildAuthorPostsPageQuery = (start: number, end: number) =>
  q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: authorPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(authorPosts).notNull(true),
    }))
    .notNull(true);
