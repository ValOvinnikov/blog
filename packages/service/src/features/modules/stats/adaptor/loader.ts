import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
      ['modules:stats', `module:${id}`, 'link', 'homePage', 'page_landing'],
      tenant.projectId,
    ),
  });

  return toStatsModule(raw);
}
