import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { newsletterModuleQuery } from './query';
import { toNewsletterModule } from './transformer';
import type { TNewsletterModule } from './types';

export async function getNewsletter(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TNewsletterModule> {
  const raw = await runQuery(newsletterModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:newsletter', `module:${id}`], tenant.projectId),
  });

  return toNewsletterModule(raw);
}
