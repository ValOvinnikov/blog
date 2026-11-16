import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

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
