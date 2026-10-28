import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN, TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantSanityContext } from '@blog/service';
import type { TRequestContext } from '@web/server/request-context/request-context';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61053);

export const MOCK_TENANT_ID = mockFaker.string.uuid();

export const MOCK_OTHER_TENANT_ID = mockFaker.string.uuid();

const MOCK_TENANT_NAME = mockFaker.company.name();

const MOCK_TENANT_CREATED_AT = mockFaker.date.past();

export const MOCK_TENANT_HOST = 'tenant.example.com';

export const MOCK_TENANT_BASE_URL = 'https://example.com';

export const MOCK_TENANT_SANITY_CONTEXT: TTenantSanityContext = {
  projectId: 'default-tenant-project',
  dataset: 'default-tenant-dataset',
  token: 'default-tenant-token',
};

export const MOCK_REQUEST_CONTEXT: TRequestContext = {
  tenantId: MOCK_TENANT_ID,
  locale: LOCALE_ISO_CODES.EN,
  sanityContext: MOCK_TENANT_SANITY_CONTEXT,
  metadataBase: new URL(MOCK_TENANT_BASE_URL),
  defaultLocale: LOCALE_ISO_CODES.EN,
  liveLocales: [LOCALE_ISO_CODES.EN],
};

export const mockTenant = (overrides: Partial<TTenant> = {}): TTenant => ({
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_HOST,
  sanityProjectId: MOCK_TENANT_SANITY_CONTEXT.projectId,
  sanityDataset: MOCK_TENANT_SANITY_CONTEXT.dataset,
  sanityReadTokenEncrypted: null,
  sanityWriteTokenEncrypted: null,
  revalidateWebhookSecretEncrypted: null,
  locale: LOCALE_ISO_CODES.EN,
  additionalLocales: [LOCALE_ISO_CODES.NL],
  plan: TENANT_PLAN.GROWTH,
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
  lastActivityAt: MOCK_TENANT_CREATED_AT,
  inactivityWarnedAt: null,
  suspendedAt: null,
  deletionNotifiedAt: null,
  suspensionReason: null,
  createdAt: MOCK_TENANT_CREATED_AT,
  updatedAt: MOCK_TENANT_CREATED_AT,
  ...overrides,
});

export const MOCK_SUSPENDED_TENANT = mockTenant({
  status: TENANT_STATUS.SUSPENDED,
});
