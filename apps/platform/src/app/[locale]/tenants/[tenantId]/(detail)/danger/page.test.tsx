import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { makeTenant } from '@platform/testing/tenants/fixtures';

import TenantDangerPage from './page';

const { requireSuperAdminMock, listTenantsByIdsMock } = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

vi.mock('@platform/server/provisioning/deprovision-tenant-action', () => ({
  deprovisionTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/delete-tenant-action', () => ({
  deleteTenantAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/reactivate-tenant-action', () => ({
  reactivateTenantAction: vi.fn(),
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

  it('never offers reactivation for a live tenant', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisionedAt: null }),
    ]);

    await setup();

    expect(
      screen.queryByRole('button', { name: 'Reactivate tenant' }),
    ).not.toBeInTheDocument();
  });

  it('offers reactivation for an already-deprovisioned tenant', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisionedAt: new Date('2026-04-10T00:00:00.000Z') }),
    ]);

    await setup();

    expect(
      screen.getByRole('button', { name: 'Reactivate tenant' }),
    ).toBeVisible();
  });

  it('404s for an unknown tenant id', async () => {
    listTenantsByIdsMock.mockResolvedValue([]);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });
});
