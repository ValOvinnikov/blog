import { getPageDocument } from '@blog/service/features/pages/landing/adaptor/detail-page/loader';
import { getPageSlugs } from '@blog/service/features/pages/landing/adaptor/detail-page-params/loader';
import { getRedirect } from '@blog/service/features/pages/landing/adaptor/redirect/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { withPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';
import { safeAsync } from '@blog/utils';

export function createLandingPageService() {
  return {
    v1: {
      getPage: safeAsync(
        async (segments: string[], tenant: TTenantSanityContext) =>
          withPageFaqs(await getPageDocument(segments, tenant), tenant),
      ),
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
