import { q, type TSlugParams } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

// `filterBy`'s strong typing only covers simple equality/comparison
// expressions; the `in` operator across a dereferenced array isn't
// supported, so this stays a `filterRaw` call.
const categoryPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('$slug in categories[]->slug.current');

export const categoryPagePostsQuery = categoryPosts
  .order('publishedAt desc')
  .project(postCardFragment);

export const buildCategoryPostsPageQuery = (start: number, end: number) =>
  q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: categoryPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(categoryPosts).notNull(true),
    }))
    .notNull(true);
