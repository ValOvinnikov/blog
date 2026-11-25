import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import type { TTenantSanityCredentials } from '@shinefold/db/queries/tenants';
import {
  createTenantSanityClient,
  type TTenantSanityClient,
} from '@worker/utils/tenant-sanity-client/tenant-sanity-client';

export function createPublishedTenantClient({
  projectId,
  dataset,
  token,
}: TTenantSanityCredentials): TTenantSanityClient {
  return createTenantSanityClient({
    projectId,
    dataset,
    token,
    perspective: SANITY_PERSPECTIVE.PUBLISHED,
  });
}
