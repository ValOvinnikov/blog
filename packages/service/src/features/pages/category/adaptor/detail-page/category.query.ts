import { q, type TSlugParams } from '@blog/service/sanity/query';
import { categoryFragment } from '@blog/service/shared/fragments/category';

export const categoryPageCategoryQuery = q
  .parameters<TSlugParams>()
  .star.filterByType('blog_category')
  .filterBy('slug.current == $slug')
  .slice(0)
  .project(categoryFragment);
