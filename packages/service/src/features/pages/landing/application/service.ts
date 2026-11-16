import { getPageSlugs } from '@shinefold/service/features/pages/landing/adaptor/detail-page-params/loader';
import { getRedirect } from '@shinefold/service/features/pages/landing/adaptor/redirect/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';
import { safeAsync } from '@shinefold/utils';

import { getPage } from './get-page';

export function createLandingPageService() {
  return {
    v1: {
      getPage: safeAsync(getPage),
      getPageSlugs: safeAsync(
        (
          tenant: TTenantSanityContext,
          locales: TPageQueryPageParams['locales'],
        ) => getPageSlugs(tenant, locales),
      ),
      getRedirect: safeAsync(
        (segments: string[], tenant: TTenantSanityContext) =>
          getRedirect(segments, tenant),
      ),
    },
  };
}
