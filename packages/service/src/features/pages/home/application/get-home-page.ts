import type { TMaybeUndefined } from '@blog/config';
import { getHomePageDocument } from '@blog/service/features/pages/home/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const page = await getHomePageDocument(tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
