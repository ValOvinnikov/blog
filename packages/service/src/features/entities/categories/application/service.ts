import { getCategories } from '../adaptor/loader';

export function createCategoriesService() {
  return {
    v1: { getCategories },
  };
}
