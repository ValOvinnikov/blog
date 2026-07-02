import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

export const categoryPagePostsQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('post')
  .filterRaw('$slug in categories[]->slug.current')
  .order('publishedAt desc')
  .project(postCardFragment);
