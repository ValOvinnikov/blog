import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import TenantDangerPage from './page';

const {
  requireSuperAdminMock,
  requireTenantByIdMock,
  getLatestDeprovisionRequestedAtMock,
  getTenantDeprovisioningStatusActionMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  requireTenantByIdMock: vi.fn(),
  getLatestDeprovisionRequestedAtMock: vi.fn(),
  getTenantDeprovisioningStatusActionMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@platform/server/auth/require-tenant-by-id', () => ({
  requireTenantById: requireTenantByIdMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    auditEvents: {
      getLatestDeprovisionRequestedAt: getLatestDeprovisionRequestedAtMock,
    },
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
    requireTenantByIdMock.mockReset();
    requireTenantByIdMock.mockResolvedValue({ tenant: makeTenant() });
    getLatestDeprovisionRequestedAtMock.mockReset();
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(undefined);
    getTenantDeprovisioningStatusActionMock.mockReset();
    getTenantDeprovisioningStatusActionMock.mockResolvedValue(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('never queries the tenant when the caller is not a superadmin', async () => {
    requireSuperAdminMock.mockRejectedValue(new Error('NEXT_REDIRECT'));

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(requireTenantByIdMock).not.toHaveBeenCalled();
  });

  it('renders the deprovisioning control for a permitted superadmin', async () => {
    await setup();

    expect(requireSuperAdminMock).toHaveBeenCalled();
    expect(requireTenantByIdMock).toHaveBeenCalledWith('tenant-1');
    expect(
      screen.getByRole('heading', { level: 1, name: 'Danger zone' }),
    ).toBeVisible();
    expect(screen.getByRole('button', { name: 'Deprovision' })).toBeVisible();
  });

  it('never queries the deprovision request when the tenant does not exist', async () => {
    requireTenantByIdMock.mockRejectedValue(
      new Error('NEXT_HTTP_ERROR_FALLBACK;404'),
    );

    await expect(setup()).rejects.toThrow('NEXT_HTTP_ERROR_FALLBACK;404');

    expect(getLatestDeprovisionRequestedAtMock).not.toHaveBeenCalled();
  });

  it("passes the tenant's latest deprovision request through, so a pending request shows the starting state", async () => {
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(
      new Date('2026-08-12T14:18:00.000Z'),
    );

    await setup();

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(screen.getByText('Starting…')).toBeVisible();
  });

  it('never offers reactivation for a live tenant', async () => {
    await setup();

    expect(
      screen.queryByRole('button', { name: 'Reactivate tenant' }),
    ).not.toBeInTheDocument();
  });

  it('offers reactivation for an already-deprovisioned tenant', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({
        deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
      }),
    });

    await setup();

    expect(
      screen.getByRole('button', { name: 'Reactivate tenant' }),
    ).toBeVisible();
  });

  it('renders the deprovisioning progress card once a run exists', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: { startedAt: '2026-08-12T14:18:00.000Z' },
        },
      }),
    });

    await setup();

    expect(
      screen.getByRole('heading', { name: /^Deprovisioning progress/ }),
    ).toBeVisible();
  });

  it('renders no deprovisioning progress card when deprovisioningSteps carries no run marker', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({ deprovisioningSteps: idleDeprovisioningSteps() }),
    });

    await setup();

    expect(
      screen.queryByRole('heading', { name: /^Deprovisioning progress/ }),
    ).not.toBeInTheDocument();
  });

  describe('live-tenant reading order (scope guard: unaffected by the archived reorganisation)', () => {
    it('reads header, then the Deprovision card, with no archived notice or history heading', async () => {
      await setup();

      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Deprovision this tenant',
        }),
      ).toBeVisible();
      expect(
        screen.queryByText('This tenant is archived'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('heading', { name: 'Teardown history' }),
      ).not.toBeInTheDocument();
    });
  });

  describe('archived-tenant reorganisation', () => {
    const archivedTenant = () =>
      makeTenant({
        deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: {
            startedAt: '2026-08-12T14:18:00.000Z',
            finishedAt: '2026-08-12T14:20:00.000Z',
          },
        },
      });

    it('shows the archived notice, an action row with both controls, and a Teardown history section', async () => {
      requireTenantByIdMock.mockResolvedValue({ tenant: archivedTenant() });

      await setup();

      expect(screen.getByText('This tenant is archived')).toBeVisible();
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Reactivate this tenant',
        }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', {
          level: 2,
          name: 'Delete this tenant permanently',
        }),
      ).toBeVisible();
      expect(
        screen.queryByRole('heading', { name: 'Deprovision this tenant' }),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('heading', { name: 'Teardown history' }),
      ).toBeVisible();
      expect(
        screen.getByRole('heading', { name: /^Deprovisioning progress/ }),
      ).toBeVisible();
    });

    it('renders no Teardown history section when the tenant has never been through a deprovisioning run', async () => {
      requireTenantByIdMock.mockResolvedValue({
        tenant: makeTenant({
          deprovisionedAt: new Date('2026-04-10T00:00:00.000Z'),
          deprovisioningSteps: null,
        }),
      });

      await setup();

      expect(
        screen.queryByRole('heading', { name: 'Teardown history' }),
      ).not.toBeInTheDocument();
    });
  });
});
