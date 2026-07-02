import { q } from '#/sanity/query';
import { categoryFragment } from '#/shared/fragments/category';

export const categoryPageCategoryQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('category')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(categoryFragment);
