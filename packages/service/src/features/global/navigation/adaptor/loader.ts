import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { navigationQuery } from './query';
import { toNavigation } from './transformer';
import type { TNavigation } from './types';

export async function getNavigation(
  tenant: TTenantSanityContext,
): Promise<TNavigation> {
  const raw = await runQuery(navigationQuery, {
    tenant,
    ...isr(['navigation', ...LINK_TARGET_CACHE_TAGS], tenant.projectId),
  });
  return toNavigation(raw);
}
