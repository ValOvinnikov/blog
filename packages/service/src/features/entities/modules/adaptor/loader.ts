import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query';

import { referencingModuleIdsQuery } from './query';

export async function getReferencingModuleIds(
  documentId: string,
  tenant: TTenantSanityContext,
): Promise<string[]> {
  return runQuery(referencingModuleIdsQuery, {
    parameters: { documentId },
    tenant,
    // Never cached: this decides which caches to purge, so a stale answer would outlive the change that triggered it.
    next: { revalidate: 0 },
  });
}
