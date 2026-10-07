import type { TMaybeUndefined } from '@blog/config';
import { getPageDocument } from '@blog/service/features/pages/landing/adaptor/detail-page/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import type { TLandingPage } from './types';

export async function getPage(
  segments: string[],
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingPage>> {
  const page = await getPageDocument(segments, tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
