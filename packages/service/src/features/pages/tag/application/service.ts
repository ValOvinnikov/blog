import type { TLocaleIsoCode } from '@blog/config/constants';
import { getTagPage } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import { getTagParams } from '@blog/service/features/pages/tag/adaptor/detail-page-params/loader';
import { getTagPaginationParams } from '@blog/service/features/pages/tag/adaptor/pagination-params/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createTagService() {
  return {
    v1: {
      getTagPage: safeAsync((slug: string, tenant: TTenantSanityContext) =>
        getTagPage(slug, tenant),
      ),
      getTagParams: safeAsync(
        (tenant: TTenantSanityContext, liveLocales: TLocaleIsoCode[]) =>
          getTagParams(tenant, liveLocales),
      ),
      getTagPaginationParams: safeAsync(
        (tenant: TTenantSanityContext, liveLocales: TLocaleIsoCode[]) =>
          getTagPaginationParams(tenant, liveLocales),
      ),
    },
  };
}
