import type { TDeprovisionStateTenant } from '@platform/server/provisioning/resolve-is-deprovision-underway';

export const resolveIsDeprovisionUnderway = vi.fn<
  (tenant: TDeprovisionStateTenant) => Promise<boolean>
>(async () => false);
