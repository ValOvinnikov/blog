import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { postsByIdsQuery } from './query';
import { toPostsByIds } from './transformer';
import type { TPostById } from './types';

/** Unordered: a caller that needs the input order re-sorts by id. */
export async function getPostsByIds(
  ids: string[],
  tenant: TTenantSanityContext,
): Promise<TPostById[]> {
  if (ids.length === 0) return [];

  const raw = await runQuery(postsByIdsQuery, {
    parameters: { ids },
    tenant,
    ...isr(['posts', 'author', 'topic'], tenant.projectId),
  });

  return toPostsByIds(raw);
}
