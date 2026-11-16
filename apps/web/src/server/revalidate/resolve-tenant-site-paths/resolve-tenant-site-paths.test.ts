import { faker } from '@faker-js/faker';
import { queries, TENANT_STATUS } from '@shinefold/db';
import { errorResult, okResult } from '@shinefold/utils';
import {
  FETCH_FAILED_REASON,
  REVALIDATE_LOG,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { loadTenantSanityCredentials } from '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
  mockTenant,
} from '@web/testing/shared/tenant/fixtures';
import { logger } from '@web/utils/logger/logger';

import { resolveTenantSitePaths } from './resolve-tenant-site-paths';

faker.seed(7386);

vi.mock('@shinefold/db', async () => ({
  ...(await import('@shinefold/db/constants')),
  queries: { tenants: { getTenantById: vi.fn() } },
}));

vi.mock(
  '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths',
  () => ({ deriveTenantSitePaths: vi.fn() }),
);

vi.mock(
  '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials',
  () => ({ loadTenantSanityCredentials: vi.fn() }),
);

const MOCK_PATHS = [faker.system.directoryPath()];
const MOCK_LOOKUP_ERROR = new Error(faker.lorem.sentence());

describe(resolveTenantSitePaths, () => {
  beforeEach(() => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(
      mockTenant({ id: MOCK_TENANT_ID }),
    );
    vi.mocked(loadTenantSanityCredentials).mockResolvedValue(
      MOCK_TENANT_SANITY_CONTEXT,
    );
    vi.mocked(deriveTenantSitePaths).mockResolvedValue(okResult(MOCK_PATHS));
  });

  it('derives every page of the given tenant', async () => {
    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      okResult(MOCK_PATHS),
    );
    expect(queries.tenants.getTenantById).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      includeArchived: true,
    });
    expect(loadTenantSanityCredentials).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
    });
    expect(deriveTenantSitePaths).toHaveBeenCalledWith({
      tenantId: MOCK_TENANT_ID,
      tenant: MOCK_TENANT_SANITY_CONTEXT,
    });
  });

  it('reports tenant_unresolved without a tenant id', async () => {
    expect(await resolveTenantSitePaths(undefined)).toEqual(
      errorResult(TENANT_UNRESOLVED_REASON),
    );
    expect(queries.tenants.getTenantById).not.toHaveBeenCalled();
    expect(loadTenantSanityCredentials).not.toHaveBeenCalled();
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
  ])('resolves no paths for a $case tenant', async ({ tenant }) => {
    vi.mocked(queries.tenants.getTenantById).mockResolvedValue(tenant);

    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(okResult([]));
    expect(loadTenantSanityCredentials).not.toHaveBeenCalled();
    expect(deriveTenantSitePaths).not.toHaveBeenCalled();
  });

  it('reports fetch_failed and logs when the tenant lookup throws', async () => {
    vi.mocked(queries.tenants.getTenantById).mockRejectedValue(
      MOCK_LOOKUP_ERROR,
    );

    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      errorResult(FETCH_FAILED_REASON),
    );
    expect(logger.error).toHaveBeenCalledWith(
      REVALIDATE_LOG.TENANT_BY_ID_LOOKUP_FAILED,
      { tenantId: MOCK_TENANT_ID, error: MOCK_LOOKUP_ERROR },
    );
    expect(loadTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('reports fetch_failed when a live tenant’s credentials are missing', async () => {
    vi.mocked(loadTenantSanityCredentials).mockResolvedValue(undefined);

    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      errorResult(FETCH_FAILED_REASON),
    );
    expect(deriveTenantSitePaths).not.toHaveBeenCalled();
  });
});
