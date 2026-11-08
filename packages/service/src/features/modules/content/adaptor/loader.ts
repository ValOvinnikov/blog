import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

export async function getContent(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TContentModule> {
  const raw = await runQuery(contentModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:content', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toContentModule(raw);
}
