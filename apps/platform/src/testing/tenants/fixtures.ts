import { LOCALE_ISO_CODES } from '@blog/config';
import {
  DEPROVISIONING_STEP,
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenantOwnerMembership } from '@blog/db/queries/memberships';
import type {
  TDeprovisioningStepState,
  TProvisioningStepState,
  TTenant,
  TTenantDeprovisioningState,
  TTenantProvisioningState,
} from '@blog/db/schema/tenants';
import { faker } from '@faker-js/faker';
import {
  toClientTenant,
  type TClientTenant,
} from '@platform/server/tenants/to-client-tenant';
import {
  DEFAULT_TENANTS_SORT,
  type TTenantsListQuery,
} from '@platform/utils/tenants-list-query/tenants-list-query';

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

export const MOCK_TENANT_ID = faker.string.uuid();
export const MOCK_TENANT_NAME = 'Acme Inc.';
export const MOCK_TENANT_SLUG = 'acme';
export const MOCK_TENANT_ROOT_DOMAIN = 'example.com';
export const MOCK_TENANT_DOMAIN = `${MOCK_TENANT_SLUG}.${MOCK_TENANT_ROOT_DOMAIN}`;
export const MOCK_TENANT_URL = `https://${MOCK_TENANT_DOMAIN}`;
export const MOCK_VERCEL_A_RECORD = '76.76.21.21';
export const MOCK_OTHER_TENANT_ID = faker.string.uuid();
export const MOCK_OTHER_TENANT_NAME = 'Globex Corp.';
export const MOCK_OTHER_TENANT_DOMAIN = 'globex.example.org';
export const MOCK_SITE_NAME = 'Northwind Field Notes';
export const MOCK_CUSTOM_DOMAIN = 'northwind.example.dev';
export const MOCK_CUSTOM_DOMAIN_URL = `https://${MOCK_CUSTOM_DOMAIN}`;
export const MOCK_OWNER_EMAIL = 'tenant-owner@example.com';
export const MOCK_INVITED_OWNER_EMAIL = 'invited-owner@example.com';
export const MOCK_NEW_OWNER_EMAIL = 'incoming-owner@example.com';
export const MOCK_RENAMED_TENANT_NAME = 'Acme Renamed';
export const INVITED_PENDING_TEXT = 'Invited, pending';
export const RUN_FINISHED_PENDING_TEXT = '—';
export const MOCK_OWNER_JOINED_AT = new Date('2026-08-12T09:00:00.000Z');
export const MOCK_OWNER_INVITED_AT = new Date('2026-08-10T09:00:00.000Z');

export const mockJoinedOwner = (
  email = MOCK_OWNER_EMAIL,
): TTenantOwnerMembership => ({
  email,
  hasSignedIn: true,
  joinedAt: MOCK_OWNER_JOINED_AT,
});

export const mockInvitedOwner = (
  email = MOCK_INVITED_OWNER_EMAIL,
): TTenantOwnerMembership => ({
  email,
  hasSignedIn: false,
  invitedAt: MOCK_OWNER_INVITED_AT,
});
export const MOCK_ARCHIVED_AT = new Date('2026-08-26T09:00:00.000Z');
export const MOCK_RUN_STARTED_AT = '2026-08-12T14:18:30.000Z';
export const MOCK_RUN_PLUS_1_MIN_AT = '2026-08-12T14:19:30.000Z';
export const MOCK_RUN_PLUS_2_MIN_AT = '2026-08-12T14:20:30.000Z';
export const MOCK_RUN_PLUS_4_MIN_AT = '2026-08-12T14:22:30.000Z';
export const MOCK_RUN_PLUS_6_MIN_AT = '2026-08-12T14:24:30.000Z';
export const MOCK_RUN_PLUS_7_MIN_AT = '2026-08-12T14:25:30.000Z';

export const MOCK_SANITY_PROJECT_ID = 'proj-1';
export const MOCK_TENANT_CREATED_AT = new Date('2026-04-02T00:00:00.000Z');
const TENANT_SEEDED_AT = new Date('2026-01-01T00:00:00.000Z');

export const mockTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return {
    id: MOCK_TENANT_ID,
    name: MOCK_TENANT_NAME,
    primaryDomain: MOCK_TENANT_DOMAIN,
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    sanityManagementTokenEncrypted: null,
    sanityManagementRobotId: null,
    revalidateWebhookSecretEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: TENANT_PROVISIONING_STATUS.PENDING,
    provisioningSteps: mockIdleProvisioningSteps(),
    deprovisioningSteps: null,
    siteType: null,
    siteTemplateVersion: null,
    selfServeOwnerEmailIndex: null,
    ownerSanityInviteId: null,
    ownerInviteSentAt: null,
    ownerInviteAcceptedAt: null,
    ownerSanityUserId: null,
    ownerLoginProvider: null,
    ownerSanityRole: null,
    ownerInviteHeadsUpSentAt: null,
    ownerInviteNudgeSentAt: null,
    ownerSiteReadySentAt: null,
    unsentReinviteFormerOwnerEmailEncrypted: null,
    lastActivityAt: MOCK_TENANT_CREATED_AT,
    inactivityWarnedAt: null,
    suspendedAt: null,
    deletionNotifiedAt: null,
    suspensionReason: null,
    contentMigrationFailedAt: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
    createdAt: MOCK_TENANT_CREATED_AT,
    updatedAt: MOCK_TENANT_CREATED_AT,
    ...overrides,
  };
};

const MOCK_READY_TENANT_DATASET = faker.word.noun();

export const mockReadyTenant = (overrides: Partial<TTenant> = {}): TTenant => {
  return mockTenant({
    sanityProjectId: MOCK_SANITY_PROJECT_ID,
    sanityDataset: MOCK_READY_TENANT_DATASET,
    locale: LOCALE_ISO_CODES.EN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: mockDoneProvisioningSteps(),
    seededAt: TENANT_SEEDED_AT,
    webhookCreatedAt: TENANT_SEEDED_AT,
    ...overrides,
  });
};

export const mockClientTenant = (
  overrides: Partial<TTenant> = {},
): TClientTenant => toClientTenant(mockTenant(overrides));

export const mockReadyClientTenant = (
  overrides: Partial<TTenant> = {},
): TClientTenant => toClientTenant(mockReadyTenant(overrides));

export const mockTenantsListQuery = (
  overrides: Partial<TTenantsListQuery> = {},
): TTenantsListQuery => ({
  shouldShowArchived: false,
  sort: DEFAULT_TENANTS_SORT,
  search: '',
  ...overrides,
});

export const OWNER_EMAIL_LABEL = 'Owner email';
export const PRIMARY_DOMAIN_LABEL = 'Primary domain';
export const REACTIVATE_TENANT_LABEL = 'Reactivate tenant';
export const PLATFORM_TENANT_NOTICE_TEXT =
  "This is the platform's own site, so it can't be suspended or deleted.";
export const CONFIRM_TENANT_NAME_LABEL = `Type "${MOCK_TENANT_NAME}" to confirm`;
