import { q, type TSlugParams } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

// `filterBy`'s strong typing only covers simple equality/comparison
// expressions; the `in` operator across a dereferenced array isn't
// supported, so this stays a `filterRaw` call.
export const categoryPagePostsQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_post')
  .filterRaw('$slug in categories[]->slug.current')
  .order('publishedAt desc')
  .project(postCardFragment);
