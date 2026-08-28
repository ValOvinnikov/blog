import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db';
import type {
  TProvisioningStepState,
  TTenant,
  TTenantProvisioningSteps,
} from '@blog/db/schema/tenants';

export const idleProvisioningSteps = (): TTenantProvisioningSteps => {
  const idle: TProvisioningStepState = {
    status: TENANT_PROVISIONING_STEP_STATUS.IDLE,
  };

  return {
    [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: idle,
    [TENANT_PROVISIONING_STEP.SEED_CONTENT]: idle,
    [TENANT_PROVISIONING_STEP.DEPLOY_STUDIO]: idle,
    [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: idle,
    [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: idle,
    [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: idle,
    [TENANT_PROVISIONING_STEP.OWNER_ELEVATION]: idle,
  };
};

/** Shared `TTenant` fixture builder — used by any test that needs a full tenant row rather than a single field. */
export const makeTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    slug: 'acme',
    name: 'Acme Inc.',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    locale: 'EN',
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    provisioningSteps: idleProvisioningSteps(),
    studioVercelProjectId: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    ...overrides,
  };
};
