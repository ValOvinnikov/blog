import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toHeroProfileModule(raw);
}
