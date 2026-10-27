import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_SITE_CONFIG,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@blog/auth/testing/magic-link-fixtures';
import { resolveTenantEmailBrand } from '@blog/config';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

faker.seed(6027);

const MOCK_TENANT_HOST = faker.internet.domainName();

const { getTenantByDomainMock, getSiteConfigMock } = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  queries: {
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    tenants: await vi.importActual(
      '@blog/db/queries/tenants/get-tenant-live-locales',
    ),
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

describe(resolveTenantEmailIdentity, () => {
  beforeEach(() => {
    getTenantByDomainMock.mockResolvedValue(
      mockTenant({
        locale: LOCALE_ISO_CODES.NL,
        additionalLocales: [LOCALE_ISO_CODES.FR],
      }),
    );
  });

  it('resolves a matching host to its tenant brand and name', async () => {
    getSiteConfigMock.mockResolvedValue(MOCK_SITE_CONFIG);

    const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

    expect(result).toEqual({
      brand: resolveTenantEmailBrand(MOCK_SITE_CONFIG),
      brandName: MOCK_TENANT_NAME,
      tenantId: MOCK_TENANT_ID,
      defaultLocale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR],
    });
  });

  it('resolves to undefined when the host matches no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

    expect(result).toBeUndefined();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('resolves to undefined when the matched tenant has no site config yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

    expect(result).toBeUndefined();
  });

  it.each([
    ['tenant', getTenantByDomainMock],
    ['site config', getSiteConfigMock],
  ])(
    'resolves to undefined rather than throwing when the %s lookup fails',
    async (_, lookupMock) => {
      lookupMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

      expect(result).toBeUndefined();
    },
  );
});
