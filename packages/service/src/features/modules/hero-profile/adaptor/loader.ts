import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { heroProfileModuleQuery } from './query';
import { toHeroProfileModule } from './transformer';
import type { THeroProfileModule } from './types';

export async function getHeroProfile(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroProfileModule> {
  const raw = await runQuery(heroProfileModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroProfile',
        `module:${id}`,
        'author',
        ...LINK_TARGET_CACHE_TAGS,
      ],
      tenant.projectId,
    ),
  });

  return toHeroProfileModule(raw);
}
