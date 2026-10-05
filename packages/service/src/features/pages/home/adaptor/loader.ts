import type { TMaybeUndefined } from '@blog/config';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const raw = await runQuery(homePageQuery, {
    tenant,
    ...isr('homePage', tenant.projectId),
  });
  if (!raw) return undefined;

  return toHomePage(raw, await getPageFaqs(raw.modules, tenant));
}
