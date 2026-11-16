import type { TMaybeUndefined } from '@shinefold/config';
import { getHomePageDocument } from '@shinefold/service/features/pages/home/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getPageFaqs } from '@shinefold/service/shared/adaptors/faq-questions/page-faqs';

import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const page = await getHomePageDocument(tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
