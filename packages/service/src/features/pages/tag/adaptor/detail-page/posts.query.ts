import { q, type TSlugParams } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

// `filterBy`'s strong typing only covers simple equality/comparison
// expressions; the `in` operator across a dereferenced array isn't
// supported, so this stays a `filterRaw` call.
const tagPosts = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('$slug in tags[]->slug.current');

export const buildTagPostsPageQuery = (start: number, end: number) =>
  q
    .parameters<TSlugParams>()
    .project((sub) => ({
      posts: tagPosts
        .order('publishedAt desc')
        .slice(start, end)
        .project(postCardFragment)
        .notNull(true),
      total: sub.count(tagPosts).notNull(true),
    }))
    .notNull(true);
