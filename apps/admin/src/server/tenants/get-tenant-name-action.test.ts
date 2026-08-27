import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';

const { requireAdminMock, listTenantsByIdsMock, loggerErrorMock } = vi.hoisted(
  () => ({
    requireAdminMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
    loggerErrorMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@admin/utils/logger/logger', () => ({
  logger: { error: loggerErrorMock },
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { tenants: { listTenantsByIds: listTenantsByIdsMock } },
}));

describe('getTenantNameAction', () => {
  beforeEach(() => {
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({ id: 'admin-1' });
    listTenantsByIdsMock.mockReset();
    loggerErrorMock.mockReset();
  });

  it('requires an admin session before doing anything else', async () => {
    requireAdminMock.mockImplementation(() => {
      throw new Error('NEXT_REDIRECT');
    });
    const { getTenantNameAction } = await import('./get-tenant-name-action');

    await expect(getTenantNameAction('tenant-1')).rejects.toThrow(
      'NEXT_REDIRECT',
    );
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it("returns the tenant's own stored name", async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ id: 'tenant-1', name: 'Acme Inc.' }),
    ]);
    const { getTenantNameAction } = await import('./get-tenant-name-action');

    const result = await getTenantNameAction('tenant-1');

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(result).toBe('Acme Inc.');
    expect(loggerErrorMock).not.toHaveBeenCalled();
  });

  it('returns undefined and logs when the tenant id resolves to no row', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);
    const { getTenantNameAction } = await import('./get-tenant-name-action');

    const result = await getTenantNameAction('unknown-tenant');

    expect(result).toBeUndefined();
    expect(loggerErrorMock).toHaveBeenCalledWith(
      'platform_breadcrumb.tenant_not_found',
      { tenantId: 'unknown-tenant' },
    );
  });
});
