import { getPage } from '@blog/service/features/pages/generic/adaptor/detail-page/loader';
import { getPageSlugs } from '@blog/service/features/pages/generic/adaptor/detail-page-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createGenericPageService() {
  return {
    v1: {
      getPage: safeAsync((slug: string, tenant?: TTenantSanityContext) =>
        getPage(slug, tenant),
      ),
      getPageSlugs: safeAsync((tenant?: TTenantSanityContext) =>
        getPageSlugs(tenant),
      ),
    },
  };
}
