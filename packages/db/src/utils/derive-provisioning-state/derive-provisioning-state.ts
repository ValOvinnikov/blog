import {
  CORE_PROVISIONING_STEPS,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';

type TProvisioningState = 'IDLE' | 'RUNNING' | 'FAILED' | 'SUCCEEDED';

// A dispatched workflow reports every step IDLE until its runner starts, so
// the PROVISIONING column, not the steps map, is the only RUNNING signal then.
export function deriveProvisioningState(
  provisioningStatus: TTenantProvisioningStatus | null,
  steps: TTenantProvisioningState | null,
): TProvisioningState {
  if (provisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING) {
    return 'RUNNING';
  }

  const stepStates = CORE_PROVISIONING_STEPS.map(
    (step) => steps?.[step],
  ).filter((state) => state !== undefined);

  if (
    stepStates.length === 0 ||
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.IDLE,
    )
  ) {
    return 'IDLE';
  }

  if (
    stepStates.some(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
    )
  ) {
    return 'FAILED';
  }

  if (
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.DONE,
    )
  ) {
    return 'SUCCEEDED';
  }

  return 'RUNNING';
}
