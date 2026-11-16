import type { TMaybeUndefined } from '@shinefold/config';
import type { TTenantProvisioningStatusResult } from '@shinefold/db/queries/tenants/get-tenant-provisioning-status';

export const getTenantProvisioningStatusAction = vi.fn<
  (
    tenantId: string,
  ) => Promise<TMaybeUndefined<TTenantProvisioningStatusResult>>
>(async () => undefined);
