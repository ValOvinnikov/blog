import {
  DEPROVISIONING_STEP,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type {
  TDeprovisioningStepState,
  TProvisioningStepState,
  TTenant,
  TTenantDeprovisioningState,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';

export const idleProvisioningSteps = (): TTenantProvisioningState => {
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

export const idleDeprovisioningSteps = (): TTenantDeprovisioningState => {
  const idle: TDeprovisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return {
    [DEPROVISIONING_STEP.REMOVE_DOMAIN]: idle,
    [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: idle,
    [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: idle,
    [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: idle,
    [DEPROVISIONING_STEP.ARCHIVE_TENANT]: idle,
    [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: idle,
  };
};

/** Every deprovisioning step DONE, with no `run` set — pass one via the caller's own spread when a test needs it. */
export const doneDeprovisioningSteps = (): TTenantDeprovisioningState => {
  const done: TDeprovisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  };

  return {
    [DEPROVISIONING_STEP.REMOVE_DOMAIN]: done,
    [DEPROVISIONING_STEP.ARCHIVE_SANITY_PROJECT]: done,
    [DEPROVISIONING_STEP.REVOKE_SANITY_TOKENS]: done,
    [DEPROVISIONING_STEP.CLEAR_ARTIFACTS]: done,
    [DEPROVISIONING_STEP.ARCHIVE_TENANT]: done,
    [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: done,
  };
};

const doneProvisioningSteps = (): TTenantProvisioningState => {
  const done: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.DONE,
  };

  return {
    ...idleProvisioningSteps(),
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: done,
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: done,
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: done,
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: done,
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: done,
    [TENANT_PROVISIONING_STEP.VERIFY_CONTENT]: done,
  };
};

/** Shared `TTenant` fixture builder — used by any test that needs a full tenant row rather than a single field. */
export const makeTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    name: 'Acme Inc.',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: 'EN',
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    provisioningSteps: idleProvisioningSteps(),
    deprovisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    ...overrides,
  };
};

/**
 * A fully provisioned tenant — every step DONE except the owner-elevation
 * outcome, which is still pending — for tests of a tab/page that only needs
 * a READY tenant to render, not the provisioning flow itself.
 */
export const makeReadyTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return makeTenant({
    sanityProjectId: 'proj-1',
    sanityDataset: 'production',
    locale: 'en',
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: doneProvisioningSteps(),
    seededAt: new Date('2026-01-01T00:00:00.000Z'),
    webhookCreatedAt: new Date('2026-01-01T00:00:00.000Z'),
    ...overrides,
  });
};
