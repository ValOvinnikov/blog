import type { TLocaleIsoCode } from '@blog/config/constants';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import type { TPageQueryPageParams } from '@blog/service/shared/types/page/page-query-page-params';

import { landingPageParamsQuery } from './query';

export async function getPageSlugs(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<{ slug: string; language: TLocaleIsoCode }[]> {
  return runQuery(landingPageParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr('page_landing', tenant.projectId),
  });
}
