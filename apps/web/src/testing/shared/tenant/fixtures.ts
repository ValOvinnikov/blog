import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import type { TTenantSanityContext } from '@blog/service';
import { faker } from '@faker-js/faker';
import type { TRequestContext } from '@web/server/request-context/request-context';

export const MOCK_TENANT_ID = faker.string.uuid();

export const MOCK_OTHER_TENANT_ID = faker.string.uuid();

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

export const mockTenant = (overrides: Partial<TTenant> = {}): TTenant =>
  ({
    id: MOCK_TENANT_ID,
    primaryDomain: MOCK_TENANT_HOST,
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [LOCALE_ISO_CODES.NL],
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: null,
    ...overrides,
  }) as TTenant;
