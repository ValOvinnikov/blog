import { LOCALE_ISO_CODES } from '@blog/config';
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
import {
  toClientTenant,
  type TClientTenant,
} from '@platform/server/tenants/to-client-tenant';

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
    [DEPROVISIONING_STEP.PURGE_READER_DATA]: idle,
    [DEPROVISIONING_STEP.INVALIDATE_TENANT_CACHE]: idle,
  };
};

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
    [DEPROVISIONING_STEP.PURGE_READER_DATA]: done,
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

const TENANT_CREATED_AT = new Date('2026-04-02T00:00:00.000Z');
const TENANT_SEEDED_AT = new Date('2026-01-01T00:00:00.000Z');

export const makeTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: 'tenant-1',
    name: 'Acme Inc.',
    primaryDomain: 'acme.example.com',
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    provisioningSteps: idleProvisioningSteps(),
    deprovisioningSteps: null,
    siteType: null,
    siteTemplateVersion: null,
    ownerSanityInviteId: null,
    ownerInviteSentAt: null,
    ownerInviteAcceptedAt: null,
    ownerSanityUserId: null,
    ownerLoginProvider: null,
    ownerSanityRole: null,
    ownerInviteHeadsUpSentAt: null,
    ownerInviteNudgeSentAt: null,
    ownerSiteReadySentAt: null,
    lastActivityAt: TENANT_CREATED_AT,
    inactivityWarnedAt: null,
    suspendedAt: null,
    deletionNotifiedAt: null,
    suspensionReason: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: TENANT_CREATED_AT,
    updatedAt: TENANT_CREATED_AT,
    ...overrides,
  };
};

export const makeReadyTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return makeTenant({
    sanityProjectId: 'proj-1',
    sanityDataset: 'production',
    locale: LOCALE_ISO_CODES.EN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: doneProvisioningSteps(),
    seededAt: TENANT_SEEDED_AT,
    webhookCreatedAt: TENANT_SEEDED_AT,
    ...overrides,
  });
};

export const makeClientTenant = (
  overrides: Partial<TTenant> = {},
): TClientTenant => toClientTenant(makeTenant(overrides));
