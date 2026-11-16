import type { TStartProvisioningResult } from '@platform/server/provisioning/start-provisioning';
import { ACTION_OUTCOME } from '@shinefold/config';

export const startProvisioning = vi.fn<
  (tenantId: string) => Promise<TStartProvisioningResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
