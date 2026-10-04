import type { TLocaleIsoCode } from '@blog/config/constants';
import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
