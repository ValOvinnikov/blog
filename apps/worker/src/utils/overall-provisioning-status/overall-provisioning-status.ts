import type { TMaybeUndefined } from '@blog/config';
import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';

// Any FAILED step settles the run FAILED, or `beginTenantProvisioning`'s guard would stay shut forever.
export function overallStatusFor(
  step: TTenantProvisioningStep,
  status: TTenantProvisioningStepStatus,
): TMaybeUndefined<TTenantProvisioningStatus> {
  if (status === TENANT_PROVISIONING_STEP_STATUS.FAILED) {
    return TENANT_PROVISIONING_STATUS.FAILED;
  }
  if (
    step === TENANT_PROVISIONING_STEP.VERIFY_CONTENT &&
    status === TENANT_PROVISIONING_STEP_STATUS.DONE
  ) {
    return TENANT_PROVISIONING_STATUS.READY;
  }
  return undefined;
}
