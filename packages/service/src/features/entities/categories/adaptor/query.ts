import { q } from '@blog/service/sanity/query';
import { categoryFragment } from '@blog/service/shared/fragments/category';

export const categoriesQuery = q.star
  .filterByType('blog_category')
  .order('title asc')
  .project(categoryFragment);
