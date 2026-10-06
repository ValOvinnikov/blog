import {
  runQuery,
  type TTenantSanityContext,
} from '@blog/service/sanity/query/query';

import {
  linkIdsReferencingDocumentQuery,
  referencingModuleIdsQuery,
} from './query';

// Never cached: this decides which caches to purge, so a stale answer would outlive the change that triggered it.
const UNCACHED = { next: { revalidate: 0 } } as const;

export async function getReferencingModuleIds(
  documentId: string,
  tenant: TTenantSanityContext,
): Promise<string[]> {
  const linkIds = await runQuery(linkIdsReferencingDocumentQuery, {
    parameters: { documentId },
    tenant,
    ...UNCACHED,
  });

  return runQuery(referencingModuleIdsQuery, {
    parameters: { documentId, linkIds },
    tenant,
    ...UNCACHED,
  });
}
