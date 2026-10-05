import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { logoWallModuleQuery } from './query';
import { toLogoWallModule } from './transformer';
import type { TLogoWallModule } from './types';

export async function getLogoWallModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TLogoWallModule> {
  const raw = await runQuery(logoWallModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:logoWall', `module:${id}`, 'link', 'homePage', 'page_landing'],
      tenant.projectId,
    ),
  });

  return toLogoWallModule(raw);
}
