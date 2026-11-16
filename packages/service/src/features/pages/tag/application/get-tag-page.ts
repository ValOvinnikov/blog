import type { TMaybeUndefined } from '@shinefold/config';
import { getTagPageDocument } from '@shinefold/service/features/pages/tag/adaptor/detail-page/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { getPageFaqs } from '@shinefold/service/shared/adaptors/faq-questions/page-faqs';

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
