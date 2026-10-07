import type { TMaybeUndefined } from '@blog/config';
import { getTagPageDocument } from '@blog/service/features/pages/tag/adaptor/detail-page/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import type { TTagDetailPage } from './types';

export async function getTagPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TTagDetailPage>> {
  const page = await getTagPageDocument(slug, tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
