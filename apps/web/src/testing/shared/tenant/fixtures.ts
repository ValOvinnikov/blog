import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/config/constants';
import { TENANT_STATUS } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { MOCK_NO_BILLING } from '@blog/db/testing/tenants/billing';
import { MOCK_NO_OWNER_ACCESS } from '@blog/db/testing/tenants/owner-access';
import type { TTenantSanityContext } from '@blog/service';
import type { TRequestContext } from '@web/server/request-context/request-context';
import { createMockFaker } from '@web/testing/mock-faker';

const mockFaker = createMockFaker(61053);

export const MOCK_TENANT_ID = mockFaker.string.uuid();

export const MOCK_OTHER_TENANT_ID = mockFaker.string.uuid();

export const MOCK_TENANT_NAME = mockFaker.company.name();

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
  tenantName: MOCK_TENANT_NAME,
  locale: LOCALE_ISO_CODES.EN,
  sanityContext: MOCK_TENANT_SANITY_CONTEXT,
  metadataBase: new URL(MOCK_TENANT_BASE_URL),
  defaultLocale: LOCALE_ISO_CODES.EN,
  liveLocales: [LOCALE_ISO_CODES.EN],
  isOperatorSuspended: false,
  isDraftPreview: false,
};

export const mockTenant = (overrides: Partial<TTenant> = {}): TTenant => ({
  id: MOCK_TENANT_ID,
  name: MOCK_TENANT_NAME,
  primaryDomain: MOCK_TENANT_HOST,
  sanityProjectId: MOCK_TENANT_SANITY_CONTEXT.projectId,
  sanityDataset: MOCK_TENANT_SANITY_CONTEXT.dataset,
  sanityReadTokenEncrypted: null,
  sanityWriteTokenEncrypted: null,
  sanityManagementTokenEncrypted: null,
  sanityManagementRobotId: null,
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
  createdAt: MOCK_TENANT_CREATED_AT,
  updatedAt: MOCK_TENANT_CREATED_AT,
  ...overrides,
});

export const MOCK_SUSPENDED_TENANT = mockTenant({
  status: TENANT_STATUS.SUSPENDED,
});
