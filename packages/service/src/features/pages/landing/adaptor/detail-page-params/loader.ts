import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { landingPageParamsQuery } from './query';

export async function getPageSlugs(
  tenant: TTenantSanityContext,
): Promise<{ slug: string }[]> {
  return runQuery(landingPageParamsQuery, {
    tenant,
    ...isr('page_landing', tenant.projectId),
  });
}
