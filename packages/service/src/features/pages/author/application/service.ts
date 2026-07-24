import { getAuthorPage } from '@blog/service/features/pages/author/adaptor/detail-page/loader';
import { getAuthorParams } from '@blog/service/features/pages/author/adaptor/detail-page-params/loader';
import { getAuthorPaginationParams } from '@blog/service/features/pages/author/adaptor/pagination-params/loader';
import { safeAsync } from '@blog/utils';

type TGetAuthorPageArgs = Parameters<typeof getAuthorPage>[1];

export function createAuthorService() {
  return {
    v1: {
      // Loader still returns `TAuthorPage | null` for "author not found";
      // safeAsync only wraps arbitrary query failures, so callers check
      // `.ok` first, then `.data !== null` (see #713).
      getAuthorPage: (slug: string, args: TGetAuthorPageArgs) =>
        safeAsync(getAuthorPage(slug, args)),
      getAuthorParams,
      getAuthorPaginationParams,
    },
  };
}
