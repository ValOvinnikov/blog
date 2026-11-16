import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import type { TPageQueryPageParams } from '@shinefold/service/shared/types/page/page-query-page-params';

import { landingPageParamsQuery } from './query';
import { toLandingPageParams } from './transformer';
import type { TLandingPageParam } from './types';

export async function getPageSlugs(
  tenant: TTenantSanityContext,
  locales: TPageQueryPageParams['locales'],
): Promise<TLandingPageParam[]> {
  const raw = await runQuery(landingPageParamsQuery, {
    parameters: { locales },
    tenant,
    ...isr('page_landing', tenant.projectId),
  });

  return toLandingPageParams(raw);
}
