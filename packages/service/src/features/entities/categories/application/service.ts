import { getCategories } from '@blog/service/features/entities/categories/adaptor/loader';

export function createCategoriesService() {
  return {
    v1: { getCategories },
  };
}
