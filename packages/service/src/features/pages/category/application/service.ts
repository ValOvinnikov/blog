import { getCategoryPage } from '../adaptor/detail/loader';
import { getCategoryParams } from '../adaptor/params/loader';

export function createCategoryService() {
  return {
    v1: { getCategoryPage, getCategoryParams },
  };
}
