import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { postListPageSizeQuery } from './query';
import type { TRawPostListPageSize } from './transformer';

export async function getPostListPageSizes(
  ids: string[],
  tenant: TTenantSanityContext,
): Promise<TRawPostListPageSize[]> {
  if (ids.length === 0) return [];

  return runQuery(postListPageSizeQuery, {
    parameters: { ids },
    tenant,
    ...isr(['modules:postList'], tenant.projectId),
  });
}
