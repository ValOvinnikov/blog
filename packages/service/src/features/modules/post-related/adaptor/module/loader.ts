import { isr } from '@blog/service/sanity/query/isr';
import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import { postRelatedModuleQuery } from './query';
import { toPostRelatedModuleDocument } from './transformer';
import type { TPostRelatedModuleDocument } from './types';

export async function getPostRelatedModuleDocument(
  id: string,
  tenant: TTenantSanityContext,
): Promise<TPostRelatedModuleDocument> {
  const raw = await runQuery(postRelatedModuleQuery, {
    parameters: { id },
    tenant,
    ...isr(['modules:postRelated', `module:${id}`], tenant.projectId),
  });

  return toPostRelatedModuleDocument(raw);
}
