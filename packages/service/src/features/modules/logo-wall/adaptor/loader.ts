import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

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
      ['modules:logoWall', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toLogoWallModule(raw);
}
