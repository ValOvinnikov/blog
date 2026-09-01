import { getIndexPage } from '@blog/service/features/pages/topic-index/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTopicIndexService() {
  return {
    v1: {
      getIndexPage: safeAsync((tenant?: TTenantSanityContext) =>
        getIndexPage(tenant),
      ),
    },
  };
}
