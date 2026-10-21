import type { TMaybeUndefined } from '@blog/config';
import type { TTenantProvisioningStatusResult } from '@blog/db/queries/tenants/get-tenant-provisioning-status';

export const getTenantProvisioningStatusAction = vi.fn<
  (
    tenantId: string,
  ) => Promise<TMaybeUndefined<TTenantProvisioningStatusResult>>
>(async () => undefined);
