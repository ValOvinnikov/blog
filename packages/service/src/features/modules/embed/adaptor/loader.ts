import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { embedModuleQuery } from './query';
import { toEmbedModule } from './transformer';
import type { TEmbedModule } from './types';

export async function getEmbedModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TEmbedModule> {
  const raw = await runQuery(embedModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:embed', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toEmbedModule(raw);
}
