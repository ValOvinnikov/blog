import type * as TModule from '@web/server/internal-pages/read-internal-page-request/read-internal-page-request';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';

type TInternalPageRequest = Awaited<
  ReturnType<typeof TModule.readInternalPageRequest<{ tenantId: string }>>
>;

export const readInternalPageRequest = vi.fn(
  async (): Promise<TInternalPageRequest> => ({
    body: { tenantId: MOCK_TENANT_ID },
    tenant: mockTenantSanityCredentials(),
  }),
);
