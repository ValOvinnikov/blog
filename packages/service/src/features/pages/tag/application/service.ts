import { getTagPageDocument } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import { getTagParams } from '@blog/service/features/pages/tag/adaptor/detail-page-params/loader';
import { getTagPaginatedPages } from '@blog/service/features/pages/tag/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { withPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';
import { safeAsync } from '@blog/utils';

export function createTagService() {
  return {
    v1: {
      getTagPage: safeAsync(
        async (slug: string, tenant: TTenantSanityContext) =>
          withPageFaqs(await getTagPageDocument(slug, tenant), tenant),
      ),
      getTagParams: safeAsync(
        (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) => getTagParams(tenant, locales),
      ),
      getTagPaginationParams: safeAsync(
        async (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) =>
          getPaginationParamsWithPageSizes(
            await getTagPaginatedPages(tenant, locales),
            tenant,
          ),
      ),
    },
  };
}
