import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';

export const resolveIsDeprovisionUnderway = vi.fn<
  (
    tenant: Pick<
      TPlatformTenant,
      'id' | 'provisioningSteps' | 'deprovisioningSteps'
    >,
  ) => Promise<boolean>
>(async () => false);
