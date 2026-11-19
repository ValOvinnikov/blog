import { SANITY_PERSPECTIVE } from '@shinefold/config/constants';
import { getTenantSanityWriteCredentials } from '@shinefold/db/queries/tenants';
import { SANITY_API_VERSION } from '@worker/constants/sanity-api';
import { createClientWithTimeout } from '@worker/utils/step-deps/step-deps';
import { FatalError } from 'workflow';

export async function createTenantWriteClient(
  tenantId: string,
): Promise<ReturnType<typeof createClientWithTimeout>> {
  const credentials = await getTenantSanityWriteCredentials(tenantId);
  if (!credentials) {
    throw new FatalError(
      `Tenant "${tenantId}" has no Sanity write credentials.`,
    );
  }

  const { projectId, dataset, token } = credentials;

  return createClientWithTimeout({
    projectId,
    dataset,
    token,
    apiVersion: SANITY_API_VERSION,
    useCdn: false,
    perspective: SANITY_PERSPECTIVE.RAW,
  });
}
