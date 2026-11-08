import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { statsModuleQuery } from './query';
import { toStatsModule } from './transformer';
import type { TStatsModule } from './types';

export async function getStatsModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TStatsModule> {
  const raw = await runQuery(statsModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:stats', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toStatsModule(raw);
}
