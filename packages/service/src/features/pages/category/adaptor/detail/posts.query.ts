import { q } from '@blog/service/sanity/query';
import { postCardFragment } from '@blog/service/shared/fragments/post';

export const categoryPagePostsQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('blog_post')
  .filterRaw('$slug in categories[]->slug.current')
  .order('publishedAt desc')
  .project(postCardFragment);
