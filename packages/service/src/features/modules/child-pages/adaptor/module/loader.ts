import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { childPagesModuleQuery } from './query';
import { toChildPagesModuleDocument } from './transformer';
import type { TChildPagesModuleDocument } from './types';

export async function getChildPagesModuleDocument(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TChildPagesModuleDocument> {
  const raw = await runQuery(childPagesModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:childPages', `module:${id}`], tenant.projectId),
  });

  return toChildPagesModuleDocument(raw);
}
