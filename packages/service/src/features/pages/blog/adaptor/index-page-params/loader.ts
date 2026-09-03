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
  // Derefs `postList` — that tag must ride alongside `posts`/`page_blog`
  // (tag-scope contract, `sanity/query.ts`).
  const raw = await runQuery(indexPageParamsQuery, {
    tenant,
    ...isr(['posts', 'page_blog', 'modules:postList'], tenant.projectId),
  });
  return toIndexPageParams(raw);
}
