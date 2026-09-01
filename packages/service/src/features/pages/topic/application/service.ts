import { getTopicPage } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import { getTopicParams } from '@blog/service/features/pages/topic/adaptor/detail-page-params/loader';
import { getTopicPaginationParams } from '@blog/service/features/pages/topic/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTopicService() {
  return {
    v1: {
      getTopicPage: safeAsync((slug: string, tenant?: TTenantSanityContext) =>
        getTopicPage(slug, tenant),
      ),
      getTopicParams: safeAsync((tenant?: TTenantSanityContext) =>
        getTopicParams(tenant),
      ),
      getTopicPaginationParams: safeAsync((tenant?: TTenantSanityContext) =>
        getTopicPaginationParams(tenant),
      ),
    },
  };
}
