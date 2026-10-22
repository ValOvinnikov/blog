import {
  CORE_PROVISIONING_STEPS,
  PROVISIONING_STATE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP_STATUS,
  type TProvisioningState,
  type TTenantProvisioningStatus,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';

// A dispatched workflow reports every step IDLE until its runner starts, so
// the PROVISIONING column, not the steps map, is the only RUNNING signal then.
export function deriveProvisioningState(
  provisioningStatus: TTenantProvisioningStatus | null,
  steps: TTenantProvisioningState | null,
): TProvisioningState {
  if (provisioningStatus === TENANT_PROVISIONING_STATUS.PROVISIONING) {
    return PROVISIONING_STATE.RUNNING;
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
    return PROVISIONING_STATE.IDLE;
  }

  if (
    stepStates.some(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.FAILED,
    )
  ) {
    return PROVISIONING_STATE.FAILED;
  }

  if (
    stepStates.every(
      (step) => step.status === TENANT_PROVISIONING_STEP_STATUS.DONE,
    )
  ) {
    return PROVISIONING_STATE.SUCCEEDED;
  }

  return PROVISIONING_STATE.RUNNING;
}
