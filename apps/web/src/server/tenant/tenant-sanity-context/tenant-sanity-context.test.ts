import { faker } from '@faker-js/faker';
import { TENANT_PLAN } from '@shinefold/config/constants';
import { queries } from '@shinefold/db';
import { TENANT_STATUS } from '@shinefold/db/constants';
import type { TTenantSanityWriteCredentials } from '@shinefold/db/queries/tenants/get-tenant-sanity-write-credentials/get-tenant-sanity-write-credentials';
import type { TTenant } from '@shinefold/db/schema/tenants';
import { getPlatformSanityContext } from '@shinefold/service';
import { resolveRequestTenant } from '@web/server/tenant/request-tenant/request-tenant';
import {
  mockServableTenant,
  mockTenantSanityCredentials,
  mockTenantSanityWriteCredentials,
} from '@web/testing/server/tenant/fixtures';
import { withMemoizingReactCache } from '@web/testing/shared/react-cache/memoizing-react-cache';
import { MOCK_TENANT_ID } from '@web/testing/shared/tenant/fixtures';
import { isProductionEnvironment } from '@web/utils/is-production-environment';

import {
  getHostTenantSanityContext,
  getHostTenantSanityWriteContext,
} from './tenant-sanity-context';

faker.seed(9154);

vi.mock('@web/server/tenant/request-tenant/request-tenant');
vi.mock('@web/utils/is-production-environment');
vi.mock('@shinefold/db', async () => ({
  ...(await import('@shinefold/db/constants')),
  queries: {
    tenants: {
      toTenantSanityCredentials: vi.fn(),
      toTenantSanityWriteCredentials: vi.fn(),
    },
  },
}));
vi.mock('@shinefold/service', () => ({ getPlatformSanityContext: vi.fn() }));

const MOCK_PLATFORM_SANITY_CONTEXT = {
  projectId: faker.string.alphanumeric(8),
  dataset: faker.lorem.word(),
  token: faker.string.alphanumeric(24),
};

const MOCK_TENANT = mockServableTenant();

const UNCREDENTIALED_TENANT_CASES: [string, TTenant | undefined][] = [
  ['no tenant resolves', undefined],
  ['the matched tenant has no credentials set', MOCK_TENANT],
];

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getPlatformSanityContext).mockReturnValue(
    MOCK_PLATFORM_SANITY_CONTEXT,
  );
});

describe(getHostTenantSanityContext, () => {
  it('resolves the tenant Sanity credentials for a resolved tenant', async () => {
    const credentials = mockTenantSanityCredentials();
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(MOCK_TENANT);
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
      credentials,
    );

    await expect(getHostTenantSanityContext()).resolves.toEqual({
      isResolvable: true,
      tenant: credentials,
    });
    expect(queries.tenants.toTenantSanityCredentials).toHaveBeenCalledWith(
      MOCK_TENANT,
    );
  });

  it.each(UNCREDENTIALED_TENANT_CASES)(
    'falls back to the platform Sanity context outside production when %s',
    async (_, tenant) => {
      vi.mocked(resolveRequestTenant).mockResolvedValueOnce(tenant);

      await expect(getHostTenantSanityContext()).resolves.toEqual({
        isResolvable: true,
        tenant: MOCK_PLATFORM_SANITY_CONTEXT,
      });
    },
  );

  describe('in production', () => {
    beforeEach(() => {
      vi.mocked(isProductionEnvironment).mockReturnValue(true);
    });

    it.each(UNCREDENTIALED_TENANT_CASES)(
      'is unresolvable when %s',
      async (_, tenant) => {
        vi.mocked(resolveRequestTenant).mockResolvedValueOnce(tenant);

        await expect(getHostTenantSanityContext()).resolves.toEqual({
          isResolvable: false,
        });
        expect(getPlatformSanityContext).not.toHaveBeenCalled();
      },
    );
  });
});

describe(getHostTenantSanityWriteContext, () => {
  let credentials: TTenantSanityWriteCredentials;

  beforeEach(() => {
    credentials = mockTenantSanityWriteCredentials();
  });

  it('resolves the tenant Sanity write credentials for a resolved tenant', async () => {
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue(
      credentials,
    );

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: credentials,
      tenantId: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
      isActive: true,
    });
  });

  it('reports a suspended resolved tenant as not active', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(
      mockServableTenant({ status: TENANT_STATUS.SUSPENDED }),
    );
    vi.mocked(queries.tenants.toTenantSanityWriteCredentials).mockReturnValue(
      credentials,
    );

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: credentials,
      tenantId: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
      isActive: false,
    });
  });

  it('is unresolvable in production when no tenant resolves', async () => {
    vi.mocked(isProductionEnvironment).mockReturnValue(true);
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: false,
    });
    expect(
      queries.tenants.toTenantSanityWriteCredentials,
    ).not.toHaveBeenCalled();
  });

  it('resolves without a tenant outside production when no tenant resolves', async () => {
    vi.mocked(resolveRequestTenant).mockResolvedValueOnce(undefined);

    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: undefined,
      plan: undefined,
      isActive: true,
    });
  });

  it('keeps the tenant id when the resolved tenant has no write credentials', async () => {
    await expect(getHostTenantSanityWriteContext()).resolves.toEqual({
      isResolvable: true,
      tenant: undefined,
      tenantId: MOCK_TENANT_ID,
      plan: TENANT_PLAN.GROWTH,
      isActive: true,
    });
  });
});

describe('request-scoped memoization', () => {
  beforeEach(() => {
    vi.doMock('react', withMemoizingReactCache);
    vi.resetModules();
  });

  afterEach(() => {
    vi.doUnmock('react');
    vi.resetModules();
  });

  it('dedupes the read context when called more than once in one render pass', async () => {
    const { getHostTenantSanityContext: freshGetContext } =
      await import('./tenant-sanity-context');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('@web/server/tenant/request-tenant/request-tenant');

    await freshGetContext();
    await freshGetContext();

    expect(freshResolveRequestTenant).toHaveBeenCalledTimes(1);
  });

  it('dedupes the write context when called more than once in one render pass', async () => {
    const { getHostTenantSanityWriteContext: freshGetWriteContext } =
      await import('./tenant-sanity-context');
    const { resolveRequestTenant: freshResolveRequestTenant } =
      await import('@web/server/tenant/request-tenant/request-tenant');

    await freshGetWriteContext();
    await freshGetWriteContext();

    expect(freshResolveRequestTenant).toHaveBeenCalledTimes(1);
  });
});
