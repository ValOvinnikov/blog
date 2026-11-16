import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { teamModuleQuery } from './query';
import { toTeamModule } from './transformer';
import type { TTeamModule } from './types';

export async function getTeamModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TTeamModule> {
  const raw = await runQuery(teamModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:team', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toTeamModule(raw);
}
