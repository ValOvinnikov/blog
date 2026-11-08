import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';
import { hasLength } from '@blog/utils/primitives';

import { postsByIdsQuery } from './query';
import { toPostsByIds } from './transformer';
import type { TPostById } from './types';

/** Unordered: a caller that needs the input order re-sorts by id. */
export async function getPostsByIds(
  ids: string[],
  tenant: TTenantSanityContext,
): Promise<TPostById[]> {
  if (!hasLength(ids)) return [];

  const raw = await runQuery(postsByIdsQuery, {
    parameters: { ids },
    tenant,
    ...isr(
      ['posts', 'author', 'topic', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toPostsByIds(raw);
}
