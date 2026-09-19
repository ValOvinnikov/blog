import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { tagPaginationParamsQuery } from './query';
import { toTagPaginationParams } from './transformer';

export async function getTagPaginationParams(
  tenant: TTenantSanityContext,
): Promise<{ slug: string; page: string }[]> {
  const tagPages = await runQuery(tagPaginationParamsQuery, {
    tenant,
    ...isr(['page_tag', 'modules:postList', 'posts', 'tag'], tenant.projectId),
  });
  return toTagPaginationParams(tagPages);
}
