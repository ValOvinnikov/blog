import { isr } from '@shinefold/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@shinefold/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@shinefold/service/shared/cache-tags/link/link-target-cache-tags';

import { ctaModuleQuery } from './query';
import { toCtaModule } from './transformer';
import type { TCtaModule } from './types';

export async function getCta(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TCtaModule> {
  const raw = await runQuery(ctaModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:cta', `module:${id}`, 'topic', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toCtaModule(raw);
}
