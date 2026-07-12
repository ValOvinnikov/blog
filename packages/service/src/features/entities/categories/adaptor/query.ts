import { q } from '#/sanity/query';
import { categoryFragment } from '#/shared/fragments/category';

export const categoriesQuery = q.star
  .filterByType('blog_category')
  .order('title asc')
  .project(categoryFragment);
