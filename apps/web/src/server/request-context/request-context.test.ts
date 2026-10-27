import { LOCALE_ISO_CODES } from '@blog/config';
import { NEXT_NAVIGATION_ERROR } from '@blog/config/constants';
import { TENANT_PROVISIONING_STATUS } from '@blog/db';
import { faker } from '@faker-js/faker';
import { UNRESOLVED_TENANT_PLACEHOLDER } from '@web/server/tenant/constants/constants';
import { setMockEnv } from '@web/testing/server/infra/set-mock-env';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import {
  MOCK_TENANT_BASE_URL,
  MOCK_TENANT_HOST,
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { PRODUCTION_DATASET } from '@web/utils/is-production-environment';
import { setRequestLocale } from 'next-intl/server';

import {
  getNotFoundContext,
  peekVoiceTenant,
  type TRequestContext,
} from './request-context';
import type * as TModule from './request-context';

faker.seed(6010);

const {
  getTenantByIdMock,
  toTenantSanityCredentialsMock,
  selectLiveLocalesMock,
  mockEnv,
} = vi.hoisted(() => ({
  getTenantByIdMock: vi.fn(),
  toTenantSanityCredentialsMock: vi.fn(),
  selectLiveLocalesMock: vi.fn(),
  mockEnv: {},
}));

vi.mock('@blog/db', async () => ({
  ...(await vi.importActual('@blog/db/constants')),
  queries: {
    tenants: {
      getTenantById: getTenantByIdMock,
      toTenantSanityCredentials: toTenantSanityCredentialsMock,
      selectLiveLocales: selectLiveLocalesMock,
    },
  },
}));
vi.mock('@blog/service', () => ({
  getPlatformSanityContext: () => MOCK_PLATFORM_CONTEXT,
}));
vi.mock('@web/utils/env/env', () => ({ env: mockEnv }));

const DEVELOPMENT_DATASET = 'development';
const NOT_FOUND_TENANT_LOAD_FAILED_EVENT =
  'request_context.not_found_tenant_load_failed';
const NO_TENANT_ENTERED = 'with no tenant entered';

const MOCK_UNSERVED_LOCALE = faker.string.alpha(8);
const MOCK_NON_UUID_TENANT = faker.lorem.word();
const MOCK_DB_ERROR_MESSAGE = faker.lorem.sentence();
const MOCK_DEPROVISIONED_AT = faker.date.past({ refDate: '2026-01-01' });

const MOCK_PLATFORM_CONTEXT = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.lorem.word(),
  token: faker.string.alphanumeric(24),
};

const MOCK_TENANT_CREDENTIALS = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.lorem.word(),
  token: faker.string.alphanumeric(24),
  defaultLocale: LOCALE_ISO_CODES.EN,
};

const MOCK_SERVABLE_TENANT = mockTenant({
  sanityReadTokenEncrypted: faker.string.alphanumeric(32),
  provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
});

const params = (tenant: string, locale: string) =>
  Promise.resolve({ tenant, locale });

const loadRequestContext = async (): Promise<typeof TModule> => {
  vi.doMock('react', withMemoizingReactCache);
  vi.resetModules();
  return import('./request-context');
};

const enterAndRead = async (
  tenant: string,
  locale: string,
): Promise<TRequestContext> => {
  const requestContext = await loadRequestContext();
  await requestContext.enterRequestContext(params(tenant, locale));
  return requestContext.getRequestContext();
};

const enterWithNotFoundRead = async (tenant: string, locale: string) => {
  const requestContext = await loadRequestContext();
  const notFoundContext = requestContext.getNotFoundContext();
  await requestContext
    .enterRequestContext(params(tenant, locale))
    .catch(() => {});
  return { peekVoiceTenant: requestContext.peekVoiceTenant, notFoundContext };
};

const enterAndReadNotFound = async (tenant: string, locale: string) => {
  const { notFoundContext } = await enterWithNotFoundRead(tenant, locale);
  return notFoundContext;
};

describe('request-context', () => {
  beforeEach(() => {
    getTenantByIdMock.mockResolvedValue(MOCK_SERVABLE_TENANT);
    toTenantSanityCredentialsMock.mockReturnValue(MOCK_TENANT_CREDENTIALS);
    selectLiveLocalesMock.mockReturnValue([
      LOCALE_ISO_CODES.EN,
      LOCALE_ISO_CODES.NL,
    ]);
    setMockEnv({
      NEXT_PUBLIC_SANITY_DATASET: PRODUCTION_DATASET,
      NEXT_PUBLIC_SITE_URL: MOCK_TENANT_BASE_URL,
    });
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it("serves the entered tenant's context in the entered locale", async () => {
    await expect(
      enterAndRead(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
    ).resolves.toEqual({
      tenantId: MOCK_TENANT_ID,
      locale: LOCALE_ISO_CODES.NL,
      sanityContext: {
        ...MOCK_TENANT_CREDENTIALS,
        locale: LOCALE_ISO_CODES.NL,
      },
      metadataBase: new URL(`https://${MOCK_TENANT_HOST}`),
      defaultLocale: LOCALE_ISO_CODES.EN,
      liveLocales: [LOCALE_ISO_CODES.EN, LOCALE_ISO_CODES.NL],
    });
    expect(selectLiveLocalesMock).toHaveBeenCalledWith(MOCK_SERVABLE_TENANT);
  });

  it('sets the next-intl request locale', async () => {
    await enterAndRead(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL);

    expect(vi.mocked(setRequestLocale)).toHaveBeenCalledWith(
      LOCALE_ISO_CODES.NL,
    );
  });

  describe('with a freshly loaded requestContext', () => {
    let enterRequestContext: (typeof TModule)['enterRequestContext'];
    let getRequestContext: (typeof TModule)['getRequestContext'];

    beforeEach(async () => {
      ({ enterRequestContext, getRequestContext } = await loadRequestContext());
    });

    it('reads the tenants row once however often it is entered and read', async () => {
      await enterRequestContext(params(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN));
      await enterRequestContext(params(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN));
      await Promise.all([getRequestContext(), getRequestContext()]);

      expect(getTenantByIdMock).toHaveBeenCalledTimes(1);
      expect(getTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        includeArchived: true,
      });
    });

    it.each([
      [
        'tenant',
        params(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.EN),
        params(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN),
      ],
      [
        'locale',
        params(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN),
        params(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
      ],
    ])(
      'refuses a second entry with a different %s',
      async (_label, firstEntry, secondEntry) => {
        await enterRequestContext(firstEntry);

        await expect(enterRequestContext(secondEntry)).rejects.toThrow(
          /different route params/,
        );
      },
    );

    it('throws naming enterRequestContext when read before entry', () => {
      expect(() => getRequestContext()).toThrow(/enterRequestContext\(\)/);
    });
  });

  it('throws a 404 for a locale the site does not serve', async () => {
    await expect(
      enterAndRead(MOCK_TENANT_ID, MOCK_UNSERVED_LOCALE),
    ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  describe(NO_TENANT_ENTERED, () => {
    it('serves the platform project and the site URL without a lookup', async () => {
      await expect(
        enterAndRead(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: undefined,
        locale: LOCALE_ISO_CODES.NL,
        sanityContext: {
          ...MOCK_PLATFORM_CONTEXT,
          locale: LOCALE_ISO_CODES.NL,
        },
        metadataBase: new URL(MOCK_TENANT_BASE_URL),
        defaultLocale: undefined,
        liveLocales: undefined,
      });
      expect(getTenantByIdMock).not.toHaveBeenCalled();
    });
  });

  describe('with a tenant that has no usable Sanity credentials', () => {
    it.each([
      [
        'a row without credentials',
        () => toTenantSanityCredentialsMock.mockReturnValue(undefined),
      ],
      [
        'no row for the tenant id',
        () => getTenantByIdMock.mockResolvedValue(undefined),
      ],
    ])('throws a 404 in production for %s', async (_label, arrange) => {
      arrange();

      await expect(
        enterAndRead(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN),
      ).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
    });

    it('falls back to the platform project outside production', async () => {
      toTenantSanityCredentialsMock.mockReturnValue(undefined);
      setMockEnv({ NEXT_PUBLIC_SANITY_DATASET: DEVELOPMENT_DATASET });

      const { sanityContext } = await enterAndRead(
        MOCK_TENANT_ID,
        LOCALE_ISO_CODES.EN,
      );

      expect(sanityContext).toEqual({
        ...MOCK_PLATFORM_CONTEXT,
        locale: LOCALE_ISO_CODES.EN,
      });
    });
  });

  it('never queries a tenant id that is not UUID-shaped', async () => {
    setMockEnv({ NEXT_PUBLIC_SANITY_DATASET: DEVELOPMENT_DATASET });

    await enterAndRead(MOCK_NON_UUID_TENANT, LOCALE_ISO_CODES.EN);

    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  describe('metadataBase', () => {
    it.each([
      [
        'a tenant that is not servable',
        mockTenant({ sanityReadTokenEncrypted: null }),
      ],
      [
        'a deprovisioned tenant',
        { ...MOCK_SERVABLE_TENANT, deprovisionedAt: MOCK_DEPROVISIONED_AT },
      ],
    ])('falls back to the site URL for %s', async (_label, tenant) => {
      getTenantByIdMock.mockResolvedValue(tenant);
      setMockEnv({
        NEXT_PUBLIC_SANITY_DATASET: PRODUCTION_DATASET,
        NEXT_PUBLIC_SITE_URL: MOCK_TENANT_BASE_URL,
      });

      const { metadataBase } = await enterAndRead(
        MOCK_TENANT_ID,
        LOCALE_ISO_CODES.EN,
      );

      expect(metadataBase).toEqual(new URL(MOCK_TENANT_BASE_URL));
    });
  });

  describe(getNotFoundContext, () => {
    it('serves the entered language when it is live', async () => {
      await expect(
        enterAndReadNotFound(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
      });
    });

    it("falls back to the tenant's default language for an invalid one", async () => {
      getTenantByIdMock.mockResolvedValue(
        mockTenant({ locale: LOCALE_ISO_CODES.DE }),
      );
      selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.DE]);

      await expect(
        enterAndReadNotFound(MOCK_TENANT_ID, MOCK_UNSERVED_LOCALE),
      ).resolves.toEqual({
        tenantId: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.DE,
      });
    });

    it("falls back to the tenant's default language for a switched-off one", async () => {
      selectLiveLocalesMock.mockReturnValue([LOCALE_ISO_CODES.EN]);

      await expect(
        enterAndReadNotFound(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.EN,
      });
    });

    it('serves the tenant language when its Sanity credentials 404 the layout', async () => {
      toTenantSanityCredentialsMock.mockReturnValue(undefined);

      await expect(
        enterAndReadNotFound(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
      });
    });

    it('shares the tenants row read with the request context', async () => {
      await enterAndReadNotFound(MOCK_TENANT_ID, LOCALE_ISO_CODES.EN);

      expect(getTenantByIdMock).toHaveBeenCalledTimes(1);
    });

    it('serves the entered language and logs when the tenants row cannot be read', async () => {
      const error = new Error(MOCK_DB_ERROR_MESSAGE);
      getTenantByIdMock.mockRejectedValue(error);

      await expect(
        enterAndReadNotFound(MOCK_TENANT_ID, LOCALE_ISO_CODES.NL),
      ).resolves.toEqual({
        tenantId: MOCK_TENANT_ID,
        locale: LOCALE_ISO_CODES.NL,
      });
      const { logger } = await import('@web/utils/logger/logger');
      expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
        NOT_FOUND_TENANT_LOAD_FAILED_EVENT,
        { error },
      );
    });

    describe(NO_TENANT_ENTERED, () => {
      it.each([
        [
          'serves the entered language',
          LOCALE_ISO_CODES.FR,
          LOCALE_ISO_CODES.FR,
        ],
        [
          'falls back to English for an invalid language',
          MOCK_UNSERVED_LOCALE,
          LOCALE_ISO_CODES.EN,
        ],
      ])('%s', async (_label, enteredLocale, servedLocale) => {
        await expect(
          enterAndReadNotFound(UNRESOLVED_TENANT_PLACEHOLDER, enteredLocale),
        ).resolves.toEqual({ tenantId: undefined, locale: servedLocale });
      });
    });
  });

  describe(peekVoiceTenant, () => {
    it('resolves no tenant without waiting when no route has entered', async () => {
      const requestContext = await loadRequestContext();

      await expect(requestContext.peekVoiceTenant()).resolves.toBeUndefined();
    });

    it.each([
      ['its default language', LOCALE_ISO_CODES.EN],
      ['a language other than the default', LOCALE_ISO_CODES.NL],
    ])('resolves the entered tenant in %s', async (_label, locale) => {
      const requestContext = await loadRequestContext();
      await requestContext.enterRequestContext(params(MOCK_TENANT_ID, locale));

      await expect(requestContext.peekVoiceTenant()).resolves.toBe(
        MOCK_TENANT_ID,
      );
    });

    it('resolves no tenant when none was entered', async () => {
      const requestContext = await loadRequestContext();
      await requestContext.enterRequestContext(
        params(UNRESOLVED_TENANT_PLACEHOLDER, LOCALE_ISO_CODES.EN),
      );

      await expect(requestContext.peekVoiceTenant()).resolves.toBeUndefined();
    });

    it.each([
      [
        'the layout 404d on the language',
        MOCK_TENANT_CREDENTIALS,
        MOCK_UNSERVED_LOCALE,
      ],
      ['its Sanity credentials 404 the layout', undefined, LOCALE_ISO_CODES.EN],
    ])(
      'resolves the not-found tenant when %s',
      async (_label, credentials, locale) => {
        toTenantSanityCredentialsMock.mockReturnValue(credentials);
        const { peekVoiceTenant: peek } = await enterWithNotFoundRead(
          MOCK_TENANT_ID,
          locale,
        );

        await expect(peek()).resolves.toBe(MOCK_TENANT_ID);
      },
    );
  });
});
