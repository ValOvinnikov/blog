import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
      [
        'modules:logoWall',
        `module:${id}`,
        'block_logo',
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toLogoWallModule(raw);
}
