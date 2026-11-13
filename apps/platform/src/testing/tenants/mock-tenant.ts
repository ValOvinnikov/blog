import { LOCALE_ISO_CODES } from '@blog/config';
import {
  TENANT_PLAN,
  TENANT_PROVISIONING_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NO_BILLING } from '@blog/db/testing/tenants/billing';
import { MOCK_NO_OWNER_ACCESS } from '@blog/db/testing/tenants/owner-access';
import { faker } from '@faker-js/faker';
import {
  type TPlatformTenant,
  toPlatformTenant,
} from '@platform/utils/platform-tenant/platform-tenant';

import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_CREATED_AT,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockDoneProvisioningSteps,
  mockIdleProvisioningSteps,
} from './fixtures';

export const MOCK_TRIAL_ENDS_AT = new Date('2026-04-16T00:00:00.000Z');
const TENANT_SEEDED_AT = new Date('2026-01-01T00:00:00.000Z');

export const mockTenant = (overrides: Partial<TTenant> = {}): TPlatformTenant =>
  toPlatformTenant(
    {
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
      ...MOCK_NO_OWNER_ACCESS,
      unsentReinviteFormerOwnerEmailEncrypted: null,
      lastActivityAt: MOCK_TENANT_CREATED_AT,
      inactivityWarnedAt: null,
      suspendedAt: null,
      deletionNotifiedAt: null,
      suspensionReason: null,
      ...MOCK_NO_BILLING,
      contentMigrationFailedAt: null,
      firstPostPublishedAt: null,
      lastNotifiedOwnerElevationOutcome: null,
      seededAt: null,
      webhookCreatedAt: null,
      deprovisionedAt: null,
      createdAt: MOCK_TENANT_CREATED_AT,
      updatedAt: MOCK_TENANT_CREATED_AT,
      ...overrides,
    },
    MOCK_TENANT_CREATED_AT,
  );

const MOCK_READY_TENANT_DATASET = faker.word.noun();

export const mockReadyTenant = (
  overrides: Partial<TTenant> = {},
): TPlatformTenant =>
  mockTenant({
    sanityProjectId: MOCK_SANITY_PROJECT_ID,
    sanityDataset: MOCK_READY_TENANT_DATASET,
    locale: LOCALE_ISO_CODES.EN,
    provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
    provisioningSteps: mockDoneProvisioningSteps(),
    seededAt: TENANT_SEEDED_AT,
    webhookCreatedAt: TENANT_SEEDED_AT,
    ...overrides,
  });

export const mockTrialTenant = (overrides: Partial<TTenant> = {}) =>
  mockTenant({
    plan: TENANT_PLAN.GROWTH,
    status: TENANT_STATUS.TRIAL,
    trialEndsAt: MOCK_TRIAL_ENDS_AT,
    ...overrides,
  });
