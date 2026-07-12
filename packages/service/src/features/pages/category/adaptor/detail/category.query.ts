import { q } from '@blog/service/sanity/query';
import { categoryFragment } from '@blog/service/shared/fragments/category';

export const categoryPageCategoryQuery = q
  .parameters<{ slug: string }>()
  .star.filterByType('blog_category')
  .filterRaw('slug.current == $slug')
  .slice(0)
  .project(categoryFragment);
