import type { TValueOf } from '@blog/config/utils';

export const TENANT_PROVISIONING_STATUS = {
  PENDING: 'PENDING',
  PROVISIONING: 'PROVISIONING',
  READY: 'READY',
  FAILED: 'FAILED',
} as const;

export type TTenantProvisioningStatus = TValueOf<
  typeof TENANT_PROVISIONING_STATUS
>;

export const TENANT_PROVISIONING_STEP = {
  SANITY_PROJECT: 'SANITY_PROJECT',
  SEED_CONTENT: 'SEED_CONTENT',
  DEPLOY_STUDIO: 'DEPLOY_STUDIO',
  PERSIST_TOKEN: 'PERSIST_TOKEN',
  MAP_DOMAIN: 'MAP_DOMAIN',
  CREATE_WEBHOOK: 'CREATE_WEBHOOK',
} as const;

export type TTenantProvisioningStep = TValueOf<typeof TENANT_PROVISIONING_STEP>;

export const TENANT_PROVISIONING_STEP_STATUS = {
  IDLE: 'IDLE',
  RUNNING: 'RUNNING',
  DONE: 'DONE',
  FAILED: 'FAILED',
} as const;

export type TTenantProvisioningStepStatus = TValueOf<
  typeof TENANT_PROVISIONING_STEP_STATUS
>;
