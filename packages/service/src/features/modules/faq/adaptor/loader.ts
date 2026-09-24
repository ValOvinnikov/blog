import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

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
      [
        'modules:faq',
        `module:${id}`,
        'block_faq',
        'link',
        'homePage',
        'page_landing',
      ],
      tenant.projectId,
    ),
  });

  return toFaqModule(raw);
}
