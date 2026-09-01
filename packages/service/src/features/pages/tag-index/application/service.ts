import { getIndexPage } from '@blog/service/features/pages/tag-index/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTagIndexService() {
  return {
    v1: {
      getIndexPage: safeAsync((tenant?: TTenantSanityContext) =>
        getIndexPage(tenant),
      ),
    },
  };
}
