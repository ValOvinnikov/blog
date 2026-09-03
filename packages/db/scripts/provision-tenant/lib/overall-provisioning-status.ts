import {
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  type TTenantProvisioningStatus,
  type TTenantProvisioningStep,
  type TTenantProvisioningStepStatus,
} from '@blog/db/constants';

// A step failing at any position settles the tenant's overall
// `provisioningStatus` to FAILED — leaving it at PROVISIONING would wedge
// `beginTenantProvisioning`'s retry guard shut forever, since that guard
// only admits a row that is NULL or not PROVISIONING. Only the workflow's
// last step (CREATE_WEBHOOK) finishing settles it to READY; every other
// success touches only that step's own entry in `provisioningSteps`.
export function overallStatusFor(
  step: TTenantProvisioningStep,
  status: TTenantProvisioningStepStatus,
): TTenantProvisioningStatus | undefined {
  if (status === TENANT_PROVISIONING_STEP_STATUS.FAILED) {
    return TENANT_PROVISIONING_STATUS.FAILED;
  }
  if (
    step === TENANT_PROVISIONING_STEP.CREATE_WEBHOOK &&
    status === TENANT_PROVISIONING_STEP_STATUS.DONE
  ) {
    return TENANT_PROVISIONING_STATUS.READY;
  }
  return undefined;
}
