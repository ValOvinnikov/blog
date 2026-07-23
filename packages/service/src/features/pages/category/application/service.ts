import { getCategoryPage } from '@blog/service/features/pages/category/adaptor/detail-page/loader';
import { getCategoryParams } from '@blog/service/features/pages/category/adaptor/detail-page-params/loader';
import { getCategoryPaginationParams } from '@blog/service/features/pages/category/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

type TGetCategoryPageArgs = Parameters<typeof getCategoryPage>[1];

export function createCategoryService() {
  return {
    v1: {
      // Loader still returns `TCategoryPage | null` for "category not
      // found"; safeAsync only wraps arbitrary query failures, so callers
      // check `.ok` first, then `.data !== null` (see #713).
      getCategoryPage: (slug: string, args: TGetCategoryPageArgs) =>
        safeAsync(getCategoryPage(slug, args)),
      getCategoryParams,
      getCategoryPaginationParams,
    },
  };
}
