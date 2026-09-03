import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { genericPageParamsQuery } from './query';

export async function getPageSlugs(
  tenant: TTenantSanityContext,
): Promise<{ slug: string }[]> {
  return runQuery(genericPageParamsQuery, {
    tenant,
    ...isr('page_generic', tenant.projectId),
  });
}
