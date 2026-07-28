import { getCategories } from '@blog/service/features/entities/categories/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createCategoriesService() {
  return {
    v1: { getCategories: safeAsync(() => getCategories()) },
  };
}
