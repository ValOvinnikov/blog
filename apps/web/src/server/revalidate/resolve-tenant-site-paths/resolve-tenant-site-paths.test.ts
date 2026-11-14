import { errorResult, okResult } from '@blog/utils';
import { faker } from '@faker-js/faker';
import {
  FETCH_FAILED_REASON,
  TENANT_UNRESOLVED_REASON,
} from '@web/constants/revalidate';
import { deriveTenantSitePaths } from '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths';
import { loadTenantSanityCredentials } from '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials';
import {
  MOCK_TENANT_ID,
  MOCK_TENANT_SANITY_CONTEXT,
} from '@web/testing/shared/tenant/fixtures';

import { resolveTenantSitePaths } from './resolve-tenant-site-paths';

faker.seed(7386);

vi.mock(
  '@web/server/revalidate/derive-tenant-site-paths/derive-tenant-site-paths',
  () => ({ deriveTenantSitePaths: vi.fn() }),
);

vi.mock(
  '@web/server/revalidate/load-tenant-sanity-credentials/load-tenant-sanity-credentials',
  () => ({ loadTenantSanityCredentials: vi.fn() }),
);

const MOCK_PATHS = [faker.system.directoryPath()];

describe(resolveTenantSitePaths, () => {
  beforeEach(() => {
    vi.mocked(loadTenantSanityCredentials).mockResolvedValue(
      MOCK_TENANT_SANITY_CONTEXT,
    );
    vi.mocked(deriveTenantSitePaths).mockResolvedValue(okResult(MOCK_PATHS));
  });

  it('derives every page of the given tenant', async () => {
    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      okResult(MOCK_PATHS),
    );
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
    expect(loadTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('reports fetch_failed when the tenant’s credentials are missing', async () => {
    vi.mocked(loadTenantSanityCredentials).mockResolvedValue(undefined);

    expect(await resolveTenantSitePaths(MOCK_TENANT_ID)).toEqual(
      errorResult(FETCH_FAILED_REASON),
    );
    expect(deriveTenantSitePaths).not.toHaveBeenCalled();
  });
});
