import type { TMaybeUndefined } from '@shinefold/config';
import { getPageDocument } from '@shinefold/service/features/pages/landing/adaptor/detail-page/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getPageFaqs } from '@shinefold/service/shared/adaptors/faq-questions/page-faqs';

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
