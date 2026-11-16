import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { pricingModuleQuery } from './query';
import { toPricingModule } from './transformer';
import type { TPricingModule } from './types';

export async function getPricingModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TPricingModule> {
  const raw = await runQuery(pricingModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:pricing', `module:${id}`, ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toPricingModule(raw);
}
