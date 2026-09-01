import {
  isr,
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { contentModuleQuery } from './query';
import { toContentModule } from './transformer';
import type { TContentModule } from './types';

export async function getContent(
  id: string,
  tenant?: TTenantSanityContext,
): Promise<TContentModule> {
  const raw = await runQuery(contentModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:content', `module:${id}`], tenant?.projectId),
  });

  return toContentModule(raw);
}
