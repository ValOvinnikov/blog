import { getTagParams } from '@shinefold/service/features/pages/tag/adaptor/detail-page-params/loader';
import { safeAsync } from '@shinefold/utils';

import { getTagPage } from './get-tag-page';
import { getTagPaginationParams } from './get-tag-pagination-params';

export function createTagService() {
  return {
    v1: {
      getTagPage: safeAsync(getTagPage),
      getTagParams: safeAsync(getTagParams),
      getTagPaginationParams: safeAsync(getTagPaginationParams),
    },
  };
}
