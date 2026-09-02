import { getIndexPage } from '@blog/service/features/pages/blog/adaptor/index-page/loader';
import { getIndexPageParams } from '@blog/service/features/pages/blog/adaptor/index-page-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createBlogService() {
  return {
    v1: {
      getIndexPage: safeAsync((tenant: TTenantSanityContext) =>
        getIndexPage(tenant),
      ),
      getIndexPageParams: safeAsync((tenant: TTenantSanityContext) =>
        getIndexPageParams(tenant),
      ),
    },
  };
}
