import { getCategoryPage } from '@blog/service/features/pages/category/adaptor/detail/loader';
import { getCategoryParams } from '@blog/service/features/pages/category/adaptor/params/loader';

export function createCategoryService() {
  return {
    v1: { getCategoryPage, getCategoryParams },
  };
}
