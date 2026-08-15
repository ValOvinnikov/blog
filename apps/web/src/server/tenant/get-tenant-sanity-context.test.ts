import { queries } from '@blog/db';
import { getRequestTenantId } from '@web/server/tenant/get-request-tenant-id';

import { getTenantSanityContext } from './get-tenant-sanity-context';

vi.mock('@web/server/tenant/get-request-tenant-id', () => ({
  getRequestTenantId: vi.fn(),
}));
vi.mock('@blog/db', () => ({
  queries: { tenants: { getTenantSanityCredentials: vi.fn() } },
}));

describe(getTenantSanityContext, () => {
  it('resolves undefined when no tenant is resolved for the request', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue(undefined);

    await expect(getTenantSanityContext()).resolves.toBeUndefined();
    expect(queries.tenants.getTenantSanityCredentials).not.toHaveBeenCalled();
  });

  it('resolves the tenant Sanity credentials for the request-scoped tenant id', async () => {
    vi.mocked(getRequestTenantId).mockResolvedValue('tenant-uuid');
    vi.mocked(queries.tenants.getTenantSanityCredentials).mockResolvedValue({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });

    await expect(getTenantSanityContext()).resolves.toEqual({
      projectId: 'proj',
      dataset: 'production',
      token: 'tok',
    });
    expect(queries.tenants.getTenantSanityCredentials).toHaveBeenCalledWith(
      'tenant-uuid',
    );
  });
});
