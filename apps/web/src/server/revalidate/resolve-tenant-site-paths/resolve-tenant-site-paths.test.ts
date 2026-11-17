import { faker } from '@faker-js/faker';
import { queries, TENANT_STATUS } from '@shinefold/db';
import { errorResult, okResult } from '@shinefold/utils';
import {
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { mockTenantSanityCredentials } from '@web/testing/server/tenant/fixtures';
import { MOCK_ERROR } from '@web/testing/shared/error/fixtures';
import {
  MOCK_TENANT_ID,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantSitePaths } from './resolve-tenant-site-paths';

faker.seed(7386);

vi.mock('@shinefold/db', async () => ({
  ...(await import('@shinefold/db/constants')),
  queries: {
    tenants: { getTenantById: vi.fn(), toTenantSanityCredentials: vi.fn() },
  },
}));

vi.mock(
  '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths',
  () => ({ deriveTenantSitePaths: vi.fn() }),
);

const MOCK_PATHS = [faker.system.directoryPath()];
const MOCK_LIVE_TENANT = mockTenant();
const MOCK_CREDENTIALS = mockTenantSanityCredentials();

describe(resolveTenantSitePaths, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      MOCK_LIVE_TENANT,
    );
    vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
      MOCK_CREDENTIALS,
    );
    vi.mocked(deriveTenantSitePaths).mockResolvedValue(okResult(MOCK_PATHS));
  });

  it('derives every page of the given tenant from one tenant read', async () => {
    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      okResult(MOCK_PATHS),
    );
    expect(queries.tenants.getTenantById).toHaveBeenCalledOnce();
    expect(queries.tenants.getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(queries.tenants.toTenantSanityCredentials).toHaveBeenCalledWith(
      MOCK_LIVE_TENANT,
    );
    expect(deriveTenantSitePaths).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      tenant: MOCK_CREDENTIALS,
    });
  });

  it('reports tenant_unresolved without a tenant id', async () => {
    expect(await resolveTenantSitePaths(undefined)).toEqual(
      errorResult(TENANT_UNRESOLVED_REASON),
    );
    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
  });

  it.each([
    {
      case: 'archived',
      tenant: mockTenant({ status: TENANT_STATUS.ARCHIVED }),
    },
    {
      case: 'deprovisioned',
      tenant: mockTenant({ deprovisionedAt: faker.date.recent() }),
    },
  ])(
    'resolves no paths and logs nothing for a $case tenant',
    async ({ tenant }) => {
      vi.mocked(queries.tenants.getTenantById).mockResolvedValue(tenant);

      expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
        okResult([]),
      );
      expect(deriveTenantSitePaths).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    },
  );

  it('reports fetch_failed and logs when the tenant lookup throws', async () => {
    vi.mocked(queries.tenants.getTenantById).mockRejectedValue(MOCK_ERROR);

    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      errorResult(FETCH_FAILED_REASON),
    );
    expect(logger.error).toHaveBeenCalledWith(
      REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_ERROR },
    );
  });

  it.each([
    { case: 'credentials are missing', tenant: MOCK_LIVE_TENANT },
    { case: 'row is missing', tenant: undefined },
  ])(
    'reports fetch_failed and logs when a live tenant’s $case',
    async ({ tenant }) => {
      vi.mocked(queries.tenants.getTenantById).mockResolvedValue(tenant);
      vi.mocked(queries.tenants.toTenantSanityCredentials).mockReturnValue(
        undefined,
      );

      expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
        errorResult(FETCH_FAILED_REASON),
      );
      expect(logger.error).toHaveBeenCalledWith(
        REVALIDATE_LOG.TENANT_SANITY_CREDENTIALS_MISSING,
        { tenantId: MOCK_TENANT_ID },
      );
      expect(deriveTenantSitePaths).not.toHaveBeenCalled();
    },
  );
});
