import { getIndexPage } from '@blog/service/features/pages/post-index/adaptor/index-page/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

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
