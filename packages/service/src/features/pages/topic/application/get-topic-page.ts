import type { TMaybeUndefined } from '@blog/config';
import { getTopicPageDocument } from '@blog/service/features/pages/topic/adaptor/detail-page/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import type { TTopicDetailPage } from './types';

export async function getTopicPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTopicDetailPage>> {
  const page = await getTopicPageDocument(slug, tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
