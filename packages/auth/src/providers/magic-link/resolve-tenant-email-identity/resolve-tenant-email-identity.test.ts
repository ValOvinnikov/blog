import { faker } from '@faker-js/faker';
import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_SITE_CONFIG,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockTenant,
} from '@shinefold/auth/testing/magic-link-fixtures';
import { resolveTenantEmailBrand } from '@shinefold/config';
import { LOCALE_ISO_CODES, TENANT_PLAN } from '@shinefold/config/constants';
import { ENTITLEMENT_KIND, PLAN_LOCALE_LIMIT } from '@shinefold/db/constants';
import { mockEntitlementGrant } from '@shinefold/db/testing/tenant-entitlement-grants/mock-entitlement-grant';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

faker.seed(6027);

const MOCK_TENANT_HOST = faker.internet.domainName();

const {
  getTenantByDomainMock,
  getSiteConfigMock,
  listResolvableEntitlementGrantsMock,
} = vi.hoisted(() => ({
  getTenantByDomainMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  listResolvableEntitlementGrantsMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  queries: {
    tenantDomains: { getTenantByDomain: getTenantByDomainMock },
    tenants: await vi.importActual(
      '@shinefold/db/queries/tenants/get-tenant-live-locales',
    ),
    siteConfig: { getSiteConfig: getSiteConfigMock },
    tenantEntitlementGrants: {
      listResolvableEntitlementGrants: listResolvableEntitlementGrantsMock,
    },
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
    listResolvableEntitlementGrantsMock.mockResolvedValue([]);
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

  it('counts a granted language limit in the live locales', async () => {
    getTenantByDomainMock.mockResolvedValue(
      mockTenant({
        locale: LOCALE_ISO_CODES.NL,
        additionalLocales: [LOCALE_ISO_CODES.FR],
        plan: TENANT_PLAN.FREE,
      }),
    );
    getSiteConfigMock.mockResolvedValue(MOCK_SITE_CONFIG);
    listResolvableEntitlementGrantsMock.mockResolvedValue([
      mockEntitlementGrant({
        kind: ENTITLEMENT_KIND.LOCALE_LIMIT,
        key: ENTITLEMENT_KIND.LOCALE_LIMIT,
        value: PLAN_LOCALE_LIMIT[TENANT_PLAN.FREE] + 1,
      }),
    ]);

    const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

    expect(result?.liveLocales).toEqual([
      LOCALE_ISO_CODES.NL,
      LOCALE_ISO_CODES.FR,
    ]);
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
    ['grants', listResolvableEntitlementGrantsMock],
  ])(
    'resolves to undefined when the %s lookup fails',
    async (_, lookupMock) => {
      lookupMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

      const result = await resolveTenantEmailIdentity(MOCK_TENANT_HOST);

      expect(result).toBeUndefined();
    },
  );
});
