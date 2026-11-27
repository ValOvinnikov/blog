import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import type { TTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import { DOCUMENT_CAP_UNCOUNTED_TYPES } from '@worker/constants/document-cap';
import { createTenantSanityClient } from '@worker/utils/tenant-sanity-client/tenant-sanity-client';

const COUNT_DOCUMENTS_QUERY = 'count(*[!(_type in $uncountedTypes)])';

export async function countTenantDocuments({
  projectId,
  dataset,
  token,
}: TTenantSanityCredentials): Promise<number> {
  const client = createTenantSanityClient({
    projectId,
    dataset,
    token,
    perspective: SANITY_PERSPECTIVE.RAW,
  });
  return client.fetch<number>(COUNT_DOCUMENTS_QUERY, {
    uncountedTypes: DOCUMENT_CAP_UNCOUNTED_TYPES,
  });
}
