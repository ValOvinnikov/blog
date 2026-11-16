import { getPost } from '@shinefold/service/features/pages/post/adaptor/detail-page/loader';
import { getPostParams } from '@shinefold/service/features/pages/post/adaptor/detail-page-params/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';
import { safeAsync } from '@shinefold/utils';

export function createPostService() {
  return {
    v1: {
      getPost: safeAsync((slug: string, tenant: TTenantSanityContext) =>
        getPost(slug, tenant),
      ),
      getPostParams: safeAsync(
        (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) => getPostParams(tenant, locales),
      ),
    },
  };
}
