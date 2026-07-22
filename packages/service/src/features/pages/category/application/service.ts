import { getCategoryPage } from '@blog/service/features/pages/category/adaptor/detail-page/loader';
import { getCategoryParams } from '@blog/service/features/pages/category/adaptor/detail-page-params/loader';
import { getCategoryPaginationParams } from '@blog/service/features/pages/category/adaptor/pagination-params/loader';

export function createCategoryService() {
  return {
    v1: { getCategoryPage, getCategoryParams, getCategoryPaginationParams },
  };
}
