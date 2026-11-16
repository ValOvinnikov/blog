import type { TRetryProvisioningStepResult } from '@platform/server/provisioning/retry-provisioning-step-action';
import { ACTION_OUTCOME } from '@shinefold/config';

export const retryProvisioningStepAction = vi.fn<
  (tenantId: string) => Promise<TRetryProvisioningStepResult>
>(async () => ({ outcome: ACTION_OUTCOME.SUCCESS }));
