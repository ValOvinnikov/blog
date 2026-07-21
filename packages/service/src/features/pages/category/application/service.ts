import { getCategoryPage } from '@blog/service/features/pages/category/adaptor/detail/loader';
import { getCategoryPaginationParams } from '@blog/service/features/pages/category/adaptor/pagination-params/loader';
import { getCategoryParams } from '@blog/service/features/pages/category/adaptor/params/loader';

export function createCategoryService() {
  return {
    v1: { getCategoryPage, getCategoryParams, getCategoryPaginationParams },
  };
}
