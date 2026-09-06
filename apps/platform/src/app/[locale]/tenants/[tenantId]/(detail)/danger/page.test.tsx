import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import TenantDangerPage from './page';

const {
  requireSuperAdminMock,
  listTenantsByIdsMock,
  getTenantDeprovisioningStatusActionMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getTenantDeprovisioningStatusActionMock: vi.fn(),
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

vi.mock(
  '@platform/server/provisioning/get-tenant-deprovisioning-status-action',
  () => ({
    getTenantDeprovisioningStatusAction:
      getTenantDeprovisioningStatusActionMock,
  }),
);

const setup = customRenderAsync(TenantDangerPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(TenantDangerPage, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });
    listTenantsByIdsMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
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

  it('renders unchanged, with no deprovisioning progress card, for a tenant that has never been deprovisioned', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisioningSteps: null }),
    ]);

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Deprovisioning progress' }),
    ).not.toBeInTheDocument();
  });

  it('renders the deprovisioning progress card once a run exists', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      }),
    ]);

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Deprovisioning progress' }),
    ).toBeVisible();
  });

  it('renders no deprovisioning progress card when deprovisioningSteps carries no run marker', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisioningSteps: idleDeprovisioningSteps() }),
    ]);

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Deprovisioning progress' }),
    ).not.toBeInTheDocument();
  });
});
