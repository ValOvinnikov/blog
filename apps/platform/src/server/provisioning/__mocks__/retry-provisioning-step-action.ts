import { ACTION_OUTCOME } from '@blog/config';
import type { TRetryProvisioningStepResult } from '@platform/server/provisioning/retry-provisioning-step-action';

export const retryProvisioningStepAction = vi.fn<
  (tenantId: string) => Promise<TRetryProvisioningStepResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
