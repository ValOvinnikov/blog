import type { TLocaleIsoCode } from '@blog/config/constants';
import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { landingPageParamsQuery } from './query';

export async function getPageSlugs(
  tenant: TTenantSanityContext,
  liveLocales: TLocaleIsoCode[],
): Promise<{ slug: string; language: TLocaleIsoCode }[]> {
  return runQuery(landingPageParamsQuery, {
    parameters: { liveLocales },
    tenant,
    ...isr('page_landing', tenant.projectId),
  });
}
