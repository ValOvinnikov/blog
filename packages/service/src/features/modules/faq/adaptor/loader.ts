import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';
import { LINK_TARGET_CACHE_TAGS } from '@blog/service/shared/cache-tags/link/link-target-cache-tags';

import { faqModuleQuery } from './query';
import { toFaqModule } from './transformer';
import type { TFaqModule } from './types';

export async function getFaqModule(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TFaqModule> {
  const raw = await runQuery(faqModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(
      ['modules:faq', `module:${id}`, 'block_faq', ...LINK_TARGET_CACHE_TAGS],
      tenant.projectId,
    ),
  });

  return toFaqModule(raw);
}
