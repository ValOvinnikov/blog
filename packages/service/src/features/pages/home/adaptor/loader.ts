import type { TMaybeUndefined } from '@blog/config';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { getPageFaqs } from '@blog/service/shared/adaptors/faq-questions/page-faqs';
import { buildLocaleQueryParams } from '@blog/service/shared/localization/locale-query-params/locale-query-params';

import { homePageQuery } from './query';
import { toHomePage } from './transformer';
import type { THomePage } from './types';

export async function getHomePage(
  tenant: TTenantSanityContext,
): Promise<TMaybeUndefined<THomePage>> {
  const raw = await runQuery(homePageQuery, {
    tenant,
    ...isr(['homePage', 'template_home'], tenant.projectId),
  });
  if (!raw) return undefined;

  return toHomePage(
    raw,
    buildLocaleQueryParams(tenant).defaultLocale,
    await getPageFaqs(raw.modules, tenant),
  );
}
