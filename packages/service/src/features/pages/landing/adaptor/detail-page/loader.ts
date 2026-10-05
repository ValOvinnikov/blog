import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import { landingPageQuery } from './query';
import { toLandingPage } from './transformer';
import type { TLandingPage } from './types';

export async function getPage(
  slug: string,
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<TLandingPage>> {
  const raw = await runQuery(landingPageQuery, {
    parameters: { slug },
    tenant,
    ...isr(['page_landing', 'page_template'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toLandingPage(raw, await getPageFaqs(raw.modules, tenant));
}
