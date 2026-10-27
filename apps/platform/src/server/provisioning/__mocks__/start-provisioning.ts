import { ACTION_OUTCOME } from '@blog/config';
import type { TStartProvisioningResult } from '@platform/server/provisioning/start-provisioning';

export const startProvisioning = vi.fn<
  (tenantId: string) => Promise<TStartProvisioningResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
