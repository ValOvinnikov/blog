import { getTopicPageDocument } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import { getTopicParams } from '@blog/service/features/pages/topic/adaptor/detail-page-params/loader';
import { getTopicPaginatedPages } from '@blog/service/features/pages/topic/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { withPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';
import { getPaginationParamsWithPageSizes } from '@blog/service/shared/adaptors/post-list-page-size/pagination-params';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';
import { safeAsync } from '@blog/utils';

export function createTopicService() {
  return {
    v1: {
      getTopicPage: safeAsync(
        async (slug: string, tenant: TTenantSanityContext) =>
          withPageFaqs(await getTopicPageDocument(slug, tenant), tenant),
      ),
      getTopicParams: safeAsync(
        (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) => getTopicParams(tenant, locales),
      ),
      getTopicPaginationParams: safeAsync(
        async (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) =>
          getPaginationParamsWithPageSizes(
            await getTopicPaginatedPages(tenant, locales),
            tenant,
          ),
      ),
    },
  };
}
