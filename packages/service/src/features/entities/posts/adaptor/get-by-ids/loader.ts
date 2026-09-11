import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';
import type { TPostCard } from '@blog/service/shared/transformers/to-post-card';

import { postsByIdsQuery } from './query';
import { toPostsByIds } from './transformer';

/**
 * Post-card data for an explicit list of Sanity `_id`s, in whatever order
 * the query returns them — callers that need a specific order (e.g. a
 * reader's bookmarks sorted by save date) re-sort by id themselves.
 */
export async function getPostsByIds(
  ids: string[],
  tenant: TTenantSanityContext,
): Promise<TPostCard[]> {
  if (ids.length === 0) return [];

  const raw = await runQuery(postsByIdsQuery, {
    parameters: { ids },
    tenant,
    ...isr(['posts', 'author', 'topic'], tenant.projectId),
  });

  return toPostsByIds(raw);
}
