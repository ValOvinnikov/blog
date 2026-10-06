import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

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
      ['modules:pricing', `module:${id}`, 'link', 'homePage', 'page_landing'],
      tenant.projectId,
    ),
  });

  return toPricingModule(raw);
}
