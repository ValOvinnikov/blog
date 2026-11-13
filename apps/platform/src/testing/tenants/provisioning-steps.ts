import {
  DEPROVISIONING_STEP,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import type {
  TDeprovisioningStepState,
  TProvisioningStepState,
  TTenantDeprovisioningState,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';

export const mockIdleProvisioningSteps = (): TTenantProvisioningState => {
  const idle: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return {
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: idle,
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: idle,
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: idle,
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: idle,
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: idle,
    [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: idle,
    [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: idle,
  };
};

export const mockIdleDeprovisioningSteps = (): TTenantDeprovisioningState => {
  const idle: TDeprovisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return {
    [DEPROVISIONING_STEP.REMOVE_DOMAIN]: idle,
    [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: idle,
    [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: idle,
    [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: idle,
    [DEPROVISIONING_STEP.ARCHIVE_TENANT]: idle,
    [DEPROVISIONING_STEP.PURGE_READER_DATA]: idle,
    [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: idle,
  };
};

export const mockDoneDeprovisioningSteps = (): TTenantDeprovisioningState => {
  const done: TDeprovisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  };

  return {
    [DEPROVISIONING_STEP.REMOVE_DOMAIN]: done,
    [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: done,
    [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: done,
    [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: done,
    [DEPROVISIONING_STEP.ARCHIVE_TENANT]: done,
    [DEPROVISIONING_STEP.PURGE_READER_DATA]: done,
    [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: done,
  };
};

export const mockDoneProvisioningSteps = (): TTenantProvisioningState => {
  const done: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  };

  return {
    ...mockIdleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
    [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: done,
  };
};

export const mockFirstStepRunningProvisioningSteps =
  (): TTenantProvisioningState => ({
    ...mockIdleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
    },
  });

export const mockFirstStepDoneProvisioningSteps =
  (): TTenantProvisioningState => ({
    ...mockIdleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
      status: TENANT_PROVISIONING_STEP_STATUS.DONE,
    },
  });

export const mockMapDomainFailedProvisioningSteps = (
  error: string,
): TTenantProvisioningState => ({
  ...mockIdleProvisioningSteps(),
  [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
    status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
    error,
  },
});
