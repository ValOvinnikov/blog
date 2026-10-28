import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { createMockFaker } from '@worker/testing/mock-faker';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';

const mockFaker = createMockFaker(6025);

export const MOCK_TENANT_ID = mockFaker.string.uuid();
export const MOCK_TENANT_DOMAIN = 'acme.example.com';
export const MOCK_CUSTOM_DOMAIN = 'blog.customer.example';
export const MOCK_SANITY_PROJECT_ID = 'sanity-project-1';
export const MOCK_SANITY_DATASET = MOCK_PROVISION_ENV.tenantSanityDataset;
export const MOCK_SANITY_READ_TOKEN = 'sk-read';
export const MOCK_ENCRYPTED_TOKEN = 'encrypted-read-token';

export function mockTenant(overrides: Partial<TTenant> = {}): TTenant {
  return {
    id: MOCK_TENANT_ID,
    name: 'Acme',
    primaryDomain: MOCK_TENANT_DOMAIN,
    sanityProjectId: null,
    sanityDataset: null,
    sanityReadTokenEncrypted: null,
    sanityWriteTokenEncrypted: null,
    revalidateWebhookSecretEncrypted: null,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [],
    plan: TENANT_PLAN.FREE,
    status: TENANT_STATUS.ACTIVE,
    provisioningStatus: null,
    provisioningSteps: null,
    lastNotifiedOwnerElevationOutcome: null,
    seededAt: null,
    webhookCreatedAt: null,
    deprovisionedAt: null,
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
    lastActivityAt: new Date(0),
    inactivityWarnedAt: null,
    suspendedAt: null,
    deletionNotifiedAt: null,
    suspensionReason: null,
    contentMigrationFailedAt: null,
    createdAt: new Date(0),
    updatedAt: new Date(0),
    ...overrides,
  };
}

export function mockProvisionedTenant(
  overrides: Partial<TTenant> = {},
): TTenant {
  return mockTenant({
    sanityProjectId: MOCK_SANITY_PROJECT_ID,
    sanityDataset: MOCK_SANITY_DATASET,
    ...overrides,
  });
}
