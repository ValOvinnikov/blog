import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@blog/auth/testing/magic-link-fixtures';
import { resolveTenantEmailBrand } from '@blog/config';
import { LOCALE_ISO_CODES, PRESET_ID } from '@blog/config/constants';
import { TENANT_PLAN } from '@blog/db/constants';

import { resolveTenantEmailIdentity } from './resolve-tenant-email-identity';

const TENANT_HOST = 'acme.example.com';

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
    getTenantByDomainMock.mockReset();
    getSiteConfigMock.mockReset();
    getTenantByDomainMock.mockResolvedValue({
      id: MOCK_TENANT_ID,
      name: MOCK_TENANT_NAME,
      locale: LOCALE_ISO_CODES.NL,
      additionalLocales: [LOCALE_ISO_CODES.FR],
      plan: TENANT_PLAN.GROWTH,
    });
  });

  it('resolves a matching host to its tenant brand and name', async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      accentHue: 140,
      logoHue: undefined,
    });

    const result = await resolveTenantEmailIdentity(TENANT_HOST);

    expect(result).toEqual({
      brand: resolveTenantEmailBrand({
        preset: PRESET_ID.CONSOLE,
        accentHue: 140,
        logoHue: undefined,
      }),
      brandName: MOCK_TENANT_NAME,
      tenantId: MOCK_TENANT_ID,
      defaultLocale: LOCALE_ISO_CODES.NL,
      liveLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR],
    });
  });

  it('resolves to undefined when the host matches no tenant', async () => {
    getTenantByDomainMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity('unknown.example.com');

    expect(result).toBeUndefined();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('resolves to undefined when the matched tenant has no site config yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    const result = await resolveTenantEmailIdentity(TENANT_HOST);

    expect(result).toBeUndefined();
  });

  it('resolves to undefined rather than throwing when the tenant lookup fails', async () => {
    getTenantByDomainMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await resolveTenantEmailIdentity(TENANT_HOST);

    expect(result).toBeUndefined();
  });

  it('resolves to undefined rather than throwing when the site config lookup fails', async () => {
    getSiteConfigMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    const result = await resolveTenantEmailIdentity(TENANT_HOST);

    expect(result).toBeUndefined();
  });
});
