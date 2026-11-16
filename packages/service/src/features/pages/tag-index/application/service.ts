import { getIndexPage } from '@shinefold/service/features/pages/tag-index/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTagIndexService() {
  return {
    v1: {
      getIndexPage: safeAsync((tenant: TTenantSanityContext) =>
        getIndexPage(tenant),
      ),
    },
  };
}
