import { getHomePageDocument } from '@blog/service/features/pages/home/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { withPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';
import { safeAsync } from '@blog/utils';

export function createHomeService() {
  return {
    v1: {
      getHomePage: safeAsync(async (tenant: TTenantSanityContext) =>
        withPageFaqs(await getHomePageDocument(tenant), tenant),
      ),
    },
  };
}
