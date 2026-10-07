import { LOCALE_ISO_CODES } from '@blog/config';
import { TENANT_PLAN } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { setRequestLocale } from 'next-intl/server';

import type * as TModule from './request-context';

const {
  loggerErrorMock,
  getTenantByIdMock,
  toTenantSanityCredentialsMock,
  selectLiveLocalesMock,
  isProductionEnvironmentMock,
  isTenantServableMock,
} = vi.hoisted(() => ({
  loggerErrorMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  toTenantSanityCredentialsMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
  isProductionEnvironmentMock: vi.fn(),
  isTenantServableMock: vi.fn(),
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
  getPlatformSanityContext: () => ({
    projectId: 'platform-project',
    dataset: 'platform-dataset',
    token: 'platform-token',
  }),
}));
vi.mock('@web/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));
vi.mock('@web/utils/is-production-environment', () => ({
  isProductionEnvironment: isProductionEnvironmentMock,
}));
vi.mock(
  '@web/server/tenant/resolve-tenant/resolve-tenant',
  async (importOriginal) => ({
    ...(await importOriginal<
      typeof import('@web/server/tenant/resolve-tenant/resolve-tenant')
    >()),
    isTenantServable: isTenantServableMock,
  }),
);

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
    additionalLocales: [LOCALE_ISO_CODES.NL],
    plan: TENANT_PLAN.GROWTH,
    deprovisionedAt: null,
    ...overrides,
  }) as TTenant;

const params = (tenant: string, locale: string) =>
  Promise.resolve({ tenant, locale });

const loadRequestContext = async (): Promise<typeof TModule> => {
  vi.doMock('react', withMemoizingReactCache);
  vi.resetModules();
  return import('./request-context');
};

const enterAndRead = async (tenant: string, locale: string) => {
  const { enterRequestContext, getRequestContext } = await loadRequestContext();
  await enterRequestContext(params(tenant, locale));
  return getRequestContext();
};

describe('request-context', () => {
  beforeEach(() => {
    getTenantByIdMock.mockResolvedValue(buildTenantRow());
    toTenantSanityCredentialsMock.mockReturnValue(TENANT_CREDENTIALS);
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    isProductionEnvironmentMock.mockReturnValue(true);
    isTenantServableMock.mockReturnValue(true);
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it("serves the entered tenant's context in the entered locale", async () => {
    const row = buildTenantRow();
    getTenantByIdMock.mockResolvedValue(row);

    await expect(enterAndRead(TENANT_ID, LOCALE_ISO_CODES.NL)).resolves.toEqual(
      {
        tenantId: TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
        sanityContext: { ...TENANT_CREDENTIALS, locale: LOCALE_ISO_CODES.NL },
        metadataBase: new URL('https://acme.example.com'),
        defaultLocale: LOCALE_ISO_CODES.EN,
        liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
      },
    );
    expect(selectLiveLocalesMock).toHaveBeenCalledWith(row);
  });

  it('sets the next-intl request locale', async () => {
    await enterAndRead(TENANT_ID, LOCALE_ISO_CODES.NL);

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.NL,
    );
  });

  describe('with a freshly loaded module', () => {
    let enterRequestContext: (typeof TModule)['enterRequestContext'];
    let getRequestContext: (typeof TModule)['getRequestContext'];

    beforeEach(async () => {
      ({ enterRequestContext, getRequestContext } = await loadRequestContext());
    });

    it('reads the tenants row once however often it is entered and read', async () => {
      await enterRequestContext(params(TENANT_ID, LOCALE_ISO_CODES.EN));
      await enterRequestContext(params(TENANT_ID, LOCALE_ISO_CODES.EN));
      await Promise.all([getRequestContext(), getRequestContext()]);

      expect(getTenantByIdMock).toHaveBeenCalledTimes(1);
      expect(getTenantByIdMock).toHaveBeenCalledWith(TENANT_ID, {
        includeArchived: true,
      });
    });

    it('refuses a second entry with a different tenant', async () => {
      await enterRequestContext(
        params(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.EN),
      );

      await expect(
        enterRequestContext(params(TENANT_ID, LOCALE_ISO_CODES.EN)),
      ).rejects.toThrow(/different route params/);
    });

    it('refuses a second entry with a different locale', async () => {
      await enterRequestContext(params(TENANT_ID, LOCALE_ISO_CODES.EN));

      await expect(
        enterRequestContext(params(TENANT_ID, LOCALE_ISO_CODES.NL)),
      ).rejects.toThrow(/different route params/);
    });

    it('throws naming enterRequestContext when read before entry', async () => {
      expect(() => getRequestContext()).toThrow(/enterRequestContext\(\)/);
    });
  });

  it('throws a 404 for a locale the site does not serve', async () => {
    await expect(enterAndRead(TENANT_ID, 'xx')).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  describe('with no tenant entered', () => {
    it('serves the platform project and the site URL without a lookup', async () => {
      await expect(
        enterAndRead(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: undefined,
        locale: LOCALE_ISO_CODES.NL,
        sanityContext: { ...PLATFORM_CONTEXT, locale: LOCALE_ISO_CODES.NL },
        metadataBase: new URL('https://example.com'),
        defaultLocale: undefined,
        liveLocales: undefined,
      });
      expect(getTenantByIdMock).not.toHaveBeenCalled();
    });
  });

  describe('with a tenant that has no Sanity credentials', () => {
    beforeEach(() => {
      toTenantSanityCredentialsMock.mockReturnValue(undefined);
    });

    it('throws a 404 in production', async () => {
      await expect(
        enterAndRead(TENANT_ID, LOCALE_ISO_CODES.EN),
      ).rejects.toThrow('NEXT_NOT_FOUND');
    });

    it('falls back to the platform project outside production', async () => {
      isProductionEnvironmentMock.mockReturnValue(false);

      const { sanityContext } = await enterAndRead(
        TENANT_ID,
        LOCALE_ISO_CODES.EN,
      );

      expect(sanityContext).toEqual({
        ...PLATFORM_CONTEXT,
        locale: LOCALE_ISO_CODES.EN,
      });
    });
  });

  it('throws a 404 in production when the tenant id matches no row', async () => {
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(enterAndRead(TENANT_ID, LOCALE_ISO_CODES.EN)).rejects.toThrow(
      'NEXT_NOT_FOUND',
    );
  });

  it('never queries a tenant id that is not UUID-shaped', async () => {
    isProductionEnvironmentMock.mockReturnValue(false);

    await enterAndRead('not-a-tenant', LOCALE_ISO_CODES.EN);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  describe('metadataBase', () => {
    it('falls back to the site URL for a tenant that is not servable', async () => {
      isTenantServableMock.mockReturnValue(false);

      const { metadataBase } = await enterAndRead(
        TENANT_ID,
        LOCALE_ISO_CODES.EN,
      );

      expect(metadataBase).toEqual(new URL('https://example.com'));
    });

    it('falls back to the site URL for a deprovisioned tenant', async () => {
      getTenantByIdMock.mockResolvedValue(
        buildTenantRow({ deprovisionedAt: new Date('2026-01-01') }),
      );

      const { metadataBase } = await enterAndRead(
        TENANT_ID,
        LOCALE_ISO_CODES.EN,
      );

      expect(metadataBase).toEqual(new URL('https://example.com'));
    });
  });

  describe('getNotFoundContext', () => {
    const enterAndReadNotFound = async (tenant: string, locale: string) => {
      const { enterRequestContext, getNotFoundContext } =
        await loadRequestContext();
      const notFoundContext = getNotFoundContext();
      await enterRequestContext(params(tenant, locale)).catch(() => {});
      return notFoundContext;
    };

    it('serves the entered language when it is live', async () => {
      await expect(
        enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
        isDefaultLocale: false,
      });
    });

    it("serves the tenant's default language in that language", async () => {
      getTenantByIdMock.mockResolvedValue(
        buildTenantRow({ locale: LOCALE_ISO_CODES.NL }),
      );

      await expect(
        enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toMatchObject({
        locale: LOCALE_ISO_CODES.NL,
        isDefaultLocale: true,
      });
    });

    it("falls back to the tenant's default language for an invalid one", async () => {
      getTenantByIdMock.mockResolvedValue(
        buildTenantRow({ locale: LOCALE_ISO_CODES.DE }),
      );
      selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.DE]);

      await expect(enterAndReadNotFound(TENANT_ID, 'xx')).resolves.toEqual({
        tenantId: TENANT_ID,
        locale: LOCALE_ISO_CODES.DE,
        isDefaultLocale: true,
      });
    });

    it("falls back to the tenant's default language for a switched-off one", async () => {
      selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);

      await expect(
        enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toMatchObject({
        locale: LOCALE_ISO_CODES.EN,
        isDefaultLocale: true,
      });
    });

    it('serves the tenant language when its Sanity credentials 404 the layout', async () => {
      toTenantSanityCredentialsMock.mockReturnValue(undefined);

      await expect(
        enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toMatchObject({ locale: LOCALE_ISO_CODES.NL });
    });

    it('shares the tenants row read with the request context', async () => {
      await enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.EN);

      expect(getTenantByIdMock).toHaveBeenCalledTimes(1);
    });

    it('serves the entered language and logs when the tenants row cannot be read', async () => {
      const error = new Error('db down');
      getTenantByIdMock.mockRejectedValue(error);

      await expect(
        enterAndReadNotFound(TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toMatchObject({ locale: LOCALE_ISO_CODES.NL });
      expect(loggerErrorMock).toHaveBeenCalledWith(
        'request_context.not_found_tenant_load_failed',
        { error },
      );
    });

    describe('with no tenant entered', () => {
      it('serves the entered language', async () => {
        await expect(
          enterAndReadNotFound(
            UNRESOLVED_TENANT_PLACEHOLDER,
            LOCALE_ISO_CODES.FR,
          ),
        ).resolves.toEqual({
          tenantId: undefined,
          locale: LOCALE_ISO_CODES.FR,
          isDefaultLocale: false,
        });
      });

      it('falls back to English for an invalid language', async () => {
        await expect(
          enterAndReadNotFound(UNRESOLVED_TENANT_PLACEHOLDER, 'xx'),
        ).resolves.toMatchObject({
          locale: LOCALE_ISO_CODES.EN,
          isDefaultLocale: true,
        });
      });
    });
  });
});
