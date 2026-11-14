import { SANITY_PERSPECTIVE } from '@blog/config/constants';
import type { TTenantSanityCredentials } from '@blog/db/queries/tenants';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';
import { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';

export function createPublishedTenantClient({
  projectId,
  dataset,
  token,
}: TTenantSanityCredentials): ReturnType<typeof createClientWithTimeout> {
  return createClientWithTimeout({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: SANITY_PERSPECTIVE.PUBLISHED,
  });
}
