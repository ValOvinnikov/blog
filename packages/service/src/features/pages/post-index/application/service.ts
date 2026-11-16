import { getIndexPage } from '@shinefold/service/features/pages/post-index/adaptor/index-page/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

import { getIndexPageParams } from './get-index-page-params';

export function createBlogService() {
  return {
    v1: {
      getIndexPage: safeAsync((tenant: TTenantSanityContext) =>
        getIndexPage(tenant),
      ),
      getIndexPageParams: safeAsync(getIndexPageParams),
    },
  };
}
