import type { TMaybeUndefined } from '@blog/config';
import { getSectionIndexPageDocument } from '@blog/service/features/pages/section-index/adaptor/loader';
import type { TSectionIndexType } from '@blog/service/features/pages/section-index/adaptor/types';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import type { TSectionIndexPage } from './types';

export async function getSectionIndexPage(
  type: TSectionIndexType,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TSectionIndexPage>> {
  const page = await getSectionIndexPageDocument(type, tenant);
  if (!page) return undefined;

  const faqs = await getPageFaqs(page.modules, tenant);

  return { ...page, faqs };
}
