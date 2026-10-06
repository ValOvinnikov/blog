import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { indexPageParamsQuery } from './query';
import { toIndexPageParams } from './transformer';

export async function getIndexPageParams(
  tenant: TTenantSanityContext,
): Promise<{ page: string }[]> {
  const raw = await runQuery(indexPageParamsQuery, {
    tenant,
    ...isr(
      ['posts', 'page_postIndex', 'template_postIndex', 'modules:postList'],
      tenant.projectId,
    ),
  });
  return toIndexPageParams(raw);
}
