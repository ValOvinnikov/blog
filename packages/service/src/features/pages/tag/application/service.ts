import { getTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import { getTagParams } from '@blog/service/features/pages/tag/adaptor/detail-page-params/loader';
import { getTagPaginationParams } from '@blog/service/features/pages/tag/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

type TGetTagPageArgs = Parameters<typeof getTagPage>[1];

export function createTagService() {
  return {
    v1: {
      // Loader still returns `TTagPage | null` for "tag not
      // found"; safeAsync only wraps arbitrary query failures, so callers
      // check `.ok` first, then `.data !== null`.
      getTagPage: safeAsync((slug: string, args: TGetTagPageArgs) =>
        getTagPage(slug, args),
      ),
      getTagParams: safeAsync(() => getTagParams()),
      getTagPaginationParams: safeAsync((itemsPerPage: number) =>
        getTagPaginationParams(itemsPerPage),
      ),
    },
  };
}
