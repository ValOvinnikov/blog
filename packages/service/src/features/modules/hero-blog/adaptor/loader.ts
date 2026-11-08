import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { heroBlogModuleQuery } from './query';
import { toHeroBlogModule } from './transformer';
import type { THeroBlogModule } from './types';

export async function getHeroBlog(
  id: string,
  tenant: TTenantSanityContext,
): Promise<THeroBlogModule> {
  const raw = await runQuery(heroBlogModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      [
        'modules:heroBlog',
        `module:${id}`,
        'posts',
        'author',
        'topic',
        ...LINK_TARGET_CACHE_TAGS,
      ],
      tenant.projectId,
    ),
  });

  return toHeroBlogModule(raw);
}
