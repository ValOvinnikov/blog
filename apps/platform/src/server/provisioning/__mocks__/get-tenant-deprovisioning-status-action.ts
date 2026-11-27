import type { getTenantDeprovisioningStatusAction as TAction } from '@platform/server/provisioning/get-tenant-deprovisioning-status-action';

export const getTenantDeprovisioningStatusAction = vi.fn<typeof TAction>(
  async () => undefined,
);
