import { CAPABILITY, LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';

const {
  getContextTenantIdMock,
  getContextLocaleMock,
  getTenantByIdMock,
  toTenantSanityCredentialsMock,
  isCapabilityEnabledMock,
  isProductionEnvironmentMock,
  isTenantServableMock,
  notFoundMock,
  selectLiveLocalesMock,
} = vi.hoisted(() => ({
  getContextTenantIdMock: vi.fn(),
  getContextLocaleMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  toTenantSanityCredentialsMock: vi.fn(),
  isCapabilityEnabledMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  isTenantServableMock: vi.fn(),
  notFoundMock: vi.fn(() => {
    throw new Error('NEXT_NOT_FOUND');
  }),
  selectLiveLocalesMock: vi.fn(),
}));

vi.mock('./request-context', () => ({
  getContextTenantId: getContextTenantIdMock,
  getContextLocale: getContextLocaleMock,
}));
vi.mock('@blog/db', () => ({
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      toTenantSanityCredentials: toTenantSanityCredentialsMock,
      selectLiveLocales: selectLiveLocalesMock,
    },
  },
}));
vi.mock('@blog/service', () => ({
  getPlatformSanityContext: () => PLATFORM_CONTEXT,
}));
vi.mock('@web/server/settings-features/is-capability-enabled', () => ({
  isCapabilityEnabled: isCapabilityEnabledMock,
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));
vi.mock('@web/server/tenant/is-tenant-servable', () => ({
  isTenantServable: isTenantServableMock,
}));
vi.mock('next/navigation', () => ({ notFound: notFoundMock }));

const TENANT_ID = 'a1b2c3d4-e5f6-4789-a012-3456789abcde';

const PLATFORM_CONTEXT = {
  projectId: 'platform-project',
  dataset: 'platform-dataset',
  token: 'platform-token',
};

const TENANT_CREDENTIALS = {
  projectId: 'tenant-project',
  dataset: 'production',
  token: 'tenant-token',
  defaultLocale: LOCALE_ISO_CODES.EN,
};

const buildTenantRow = (overrides: Partial<TTenant> = {}): TTenant =>
  ({
    id: TENANT_ID,
    primaryDomain: 'acme.example.com',
    locale: LOCALE_ISO_CODES.EN,
    additionalLocales: [LOCALE_ISO_CODES.NL, LOCALE_ISO_CODES.FR],
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: null,
    ...overrides,
  }) as TTenant;

const loadContextTenant = async () => {
  vi.doMock('react', withMemoizingReactCache);
  vi.resetModules();
  return import('./context-tenant');
};

describe('context-tenant', () => {
  beforeEach(() => {
    getContextTenantIdMock.mockReturnValue(TENANT_ID);
    getContextLocaleMock.mockReturnValue(LOCALE_ISO_CODES.NL);
    getTenantByIdMock.mockResolvedValue(buildTenantRow());
    toTenantSanityCredentialsMock.mockReturnValue(TENANT_CREDENTIALS);
    isProductionEnvironmentMock.mockReturnValue(true);
    isTenantServableMock.mockReturnValue(true);
    isCapabilityEnabledMock.mockResolvedValue(true);
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  describe('getContextSanityContext', () => {
    it("serves the tenant's credentials in the entered locale", async () => {
      const { getContextSanityContext } = await loadContextTenant();

      await expect(getContextSanityContext()).resolves.toEqual({
        ...TENANT_CREDENTIALS,
        locale: LOCALE_ISO_CODES.NL,
      });
    });

    it('serves the platform project in the entered locale when no tenant was entered', async () => {
      getContextTenantIdMock.mockReturnValue(undefined);
      const { getContextSanityContext } = await loadContextTenant();

      await expect(getContextSanityContext()).resolves.toEqual({
        ...PLATFORM_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      });
      expect(getTenantByIdMock).not.toHaveBeenCalled();
    });

    it('throws a 404 in production when the tenant has no credentials', async () => {
      toTenantSanityCredentialsMock.mockReturnValue(undefined);
      const { getContextSanityContext } = await loadContextTenant();

      await expect(getContextSanityContext()).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('throws a 404 in production when the tenant id matches no row', async () => {
      getTenantByIdMock.mockResolvedValue(undefined);
      const { getContextSanityContext } = await loadContextTenant();

      await expect(getContextSanityContext()).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('falls back to the platform project outside production when the tenant has no credentials', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);
      toTenantSanityCredentialsMock.mockReturnValue(undefined);
      const { getContextSanityContext } = await loadContextTenant();

      await expect(getContextSanityContext()).resolves.toEqual({
        ...PLATFORM_CONTEXT,
        locale: LOCALE_ISO_CODES.NL,
      });
    });

    it('never queries a tenant id that is not UUID-shaped', async () => {
      getContextTenantIdMock.mockReturnValue('not-a-tenant');
      isProductionEnvironmentMock.mockReturnValue(false);
      const { getContextSanityContext } = await loadContextTenant();

      await getContextSanityContext();

      expect(getTenantByIdMock).not.toHaveBeenCalled();
    });
  });

  describe('getContextBaseUrl', () => {
    it("builds the base URL from a servable tenant's primary domain", async () => {
      const { getContextBaseUrl } = await loadContextTenant();

      await expect(getContextBaseUrl()).resolves.toBe(
        'https://acme.example.com',
      );
    });

    it('falls back to the site URL for a tenant that is not servable', async () => {
      isTenantServableMock.mockReturnValue(false);
      const { getContextBaseUrl } = await loadContextTenant();

      await expect(getContextBaseUrl()).resolves.toBe('https://example.com');
    });

    it('falls back to the site URL for a deprovisioned tenant', async () => {
      getTenantByIdMock.mockResolvedValue(
        buildTenantRow({ deprovisionedAt: new Date('2026-01-01') }),
      );
      const { getContextBaseUrl } = await loadContextTenant();

      await expect(getContextBaseUrl()).resolves.toBe('https://example.com');
    });

    it('falls back to the site URL when no tenant was entered', async () => {
      getContextTenantIdMock.mockReturnValue(undefined);
      const { getContextBaseUrl } = await loadContextTenant();

      await expect(getContextBaseUrl()).resolves.toBe('https://example.com');
    });
  });

  describe('getContextTenantLocales', () => {
    it("serves the tenant's default locale and its live locales", async () => {
      const row = buildTenantRow();
      getTenantByIdMock.mockResolvedValue(row);
      const { getContextTenantLocales } = await loadContextTenant();

      await expect(getContextTenantLocales()).resolves.toEqual({
        defaultLocale: LOCALE_ISO_CODES.EN,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      });
      expect(selectLiveLocalesMock).toHaveBeenCalledWith(row);
    });

    it('serves no locales when no tenant was entered', async () => {
      getContextTenantIdMock.mockReturnValue(undefined);
      const { getContextTenantLocales } = await loadContextTenant();

      await expect(getContextTenantLocales()).resolves.toBeUndefined();
    });
  });

  describe('isContextCapabilityEnabled', () => {
    it('checks the capability against the entered tenant', async () => {
      isCapabilityEnabledMock.mockResolvedValue(false);
      const { isContextCapabilityEnabled } = await loadContextTenant();

      await expect(
        isContextCapabilityEnabled(CAPABILITY.ANALYTICS),
      ).resolves.toBe(false);
      expect(isCapabilityEnabledMock).toHaveBeenCalledWith(
        CAPABILITY.ANALYTICS,
        TENANT_ID,
      );
    });

    it('is disabled without a lookup when no tenant was entered', async () => {
      getContextTenantIdMock.mockReturnValue(undefined);
      const { isContextCapabilityEnabled } = await loadContextTenant();

      await expect(
        isContextCapabilityEnabled(CAPABILITY.ANALYTICS),
      ).resolves.toBe(false);
      expect(isCapabilityEnabledMock).not.toHaveBeenCalled();
    });
  });

  it('reads the tenants row once for credentials, base URL and locales', async () => {
    const {
      getContextSanityContext,
      getContextBaseUrl,
      getContextTenantLocales,
    } = await loadContextTenant();

    await Promise.all([
      getContextSanityContext(),
      getContextBaseUrl(),
      getContextTenantLocales(),
      getContextSanityContext(),
    ]);

    expect(getTenantByIdMock).toHaveBeenCalledTimes(1);
    expect(getTenantByIdMock).toHaveBeenCalledWith(TENANT_ID, {
      includeArchived: true,
    });
  });
});
