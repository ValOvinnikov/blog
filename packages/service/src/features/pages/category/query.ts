import { q } from '#/sanity/query';
import { postCardFragment } from '#/shared/fragments/post';

export const categoryPageCategoryQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('category')
  .filterRaw('slug.current == $slug')
  .project({
    _id: true,
    title: true,
    slug: true,
    description: true,
  })
  .slice(0);

export const categoryPagePostsQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('post')
  .filterRaw('$slug in categories[]->slug.current')
  .order('publishedAt desc')
  .project(postCardFragment);
