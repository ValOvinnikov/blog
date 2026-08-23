import { getTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import { getTagParams } from '@blog/service/features/pages/tag/adaptor/detail-page-params/loader';
import { getTagPaginationParams } from '@blog/service/features/pages/tag/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

export function createTagService() {
  return {
    v1: {
      getTagPage: safeAsync((slug: string) => getTagPage(slug)),
      getTagParams: safeAsync(() => getTagParams()),
      getTagPaginationParams: safeAsync(() => getTagPaginationParams()),
    },
  };
}
