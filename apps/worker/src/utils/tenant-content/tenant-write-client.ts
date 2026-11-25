import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { getTenantSanityWriteCredentials } from '@shinefold/db/queries/tenants';
import {
  createTenantSanityClient,
  type TTenantSanityClient,
} from '@worker/utils/tenant-sanity-client/tenant-sanity-client';
import { FatalError } from 'workflow';

export async function createTenantWriteClient(
  tenantId: string,
): Promise<TTenantSanityClient> {
  const credentials = await getTenantSanityWriteCredentials(tenantId);
  if (!credentials) {
    throw new FatalError(
      `Tenant "${tenantId}" has no Sanity write credentials.`,
    );
  }

  const { projectId, dataset, token } = credentials;

  return createTenantSanityClient({
    projectId,
    dataset,
    token,
    perspective: SANITY_PERSPECTIVE.RAW,
  });
}
