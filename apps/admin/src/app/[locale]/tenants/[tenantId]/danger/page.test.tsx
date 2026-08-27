import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { makeTenant } from '@admin/testing/tenants/fixtures';

import TenantDangerPage from './page';

const { requireSuperAdminMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

vi.mock('@admin/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

vi.mock('@admin/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: vi.fn(),
}));

const setup = customRenderAsync(TenantDangerPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantDangerPage, () => {
  beforeEach(() => {
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    listTenantsByIdsMock.mockReset();
  });

  it('never queries the tenant when the caller is not a superadmin', async () => {
    requireSuperAdminMock.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('renders the deprovisioning control for a permitted superadmin', async () => {
    const tenant = makeTenant();
    listTenantsByIdsMock.mockResolvedValue([tenant]);

    await setup();

    expect(requireSuperAdminMock).toHaveBeenCalled();
    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1']);
    expect(
      screen.getByRole('heading', { level: 1, name: 'Danger zone' }),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: 'Deprovision tenant' }),
    ).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
