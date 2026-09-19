import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { indexPageParamsQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(
  tenant: TTenantSanityContext,
): Promise<{ page: string }[]> {
  const raw = await runQuery(indexPageParamsQuery, {
    tenant,
    ...isr(['posts', 'page_postIndex', 'modules:postList'], tenant.projectId),
  });
  return toIndexPageParams(raw);
}
