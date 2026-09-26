import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
      ['modules:team', `module:${id}`, 'link', 'homePage', 'page_landing'],
      tenant.projectId,
    ),
  });

  return toTeamModule(raw);
}
