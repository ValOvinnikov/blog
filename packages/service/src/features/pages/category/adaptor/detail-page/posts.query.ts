import { q, type TSlugParams } from '@blog/service/sanity/query';
import { archivePostCardFragment } from '@blog/service/shared/fragments/archive-post-card';

// `category` is a single dereferenced reference (like `author`), so this is
// now a direct equality check through the reference — no `in`-operator
// needed. `filterBy`'s strong typing only covers paths on the raw
// (undereferenced) document shape, so a dereferenced path like
// `category->slug.current` still goes through `filterRaw`.
const categoryPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('category->slug.current == $slug');

export const buildCategoryPostsPageQuery = (start: number, end: number) =>
  q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: categoryPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(archivePostCardFragment)
        .notNull(true),
      total: sub.count(categoryPosts).notNull(true),
    }))
    .notNull(true);
