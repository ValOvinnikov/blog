import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { footerQuery } from './query';
import { toFooter } from './transformer';
import type { TFooter } from './types';

export async function getFooter(
  tenant: TTenantSanityContext,
): Promise<TFooter> {
  const raw = await runQuery(footerQuery, {
    tenant,
    ...isr(['footer', ...LINK_TARGET_CACHE_TAGS], tenant.projectId),
  });
  return toFooter(raw);
}
