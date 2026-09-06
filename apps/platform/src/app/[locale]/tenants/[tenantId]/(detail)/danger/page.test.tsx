import {
  act,
  customRenderAsync,
  screen,
} from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  idleDeprovisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import TenantDangerPage from './page';

const STEP_POLL_INTERVAL_MS = 4000;
const STALE_RUN_MAX_TICKS = 75;

const {
  requireSuperAdminMock,
  listTenantsByIdsMock,
  getLatestDeprovisionRequestedAtMock,
  getTenantDeprovisioningStatusActionMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  listTenantsByIdsMock: vi.fn(),
  getLatestDeprovisionRequestedAtMock: vi.fn(),
  getTenantDeprovisioningStatusActionMock: vi.fn(),
}));

vi.mock('@platform/server/auth/require-super-admin', () => ({
  requireSuperAdmin: requireSuperAdminMock,
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { listTenantsByIds: listTenantsByIdsMock },
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
    listTenantsByIdsMock.mockReset();
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

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(
      'tenant-1',
    );
    expect(
      screen.queryByRole('heading', { name: 'Deprovisioning progress' }),
    ).not.toBeInTheDocument();
  });

  it('does not render the deprovisioning progress card after a dry run, which writes no audit event', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisioningSteps: null }),
    ]);
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(undefined);

    await setup();

    expect(
      screen.queryByRole('heading', { name: 'Deprovisioning progress' }),
    ).not.toBeInTheDocument();
  });

  it('renders the deprovisioning progress card in a starting state when a request was dispatched but no run marker has appeared yet', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisioningSteps: null }),
    ]);
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(
      new Date('2026-08-12T14:18:00.000Z'),
    );

    await setup();

    expect(
      screen.getByRole('heading', { name: 'Deprovisioning progress' }),
    ).toBeVisible();
    expect(screen.getByText('Starting…')).toBeVisible();
    expect(screen.queryByText('Not started')).not.toBeInTheDocument();
    expect(
      screen.queryByRole('heading', { level: 2, name: 'Run' }),
    ).not.toBeInTheDocument();
  });

  it('stops polling the starting state once it exceeds the same stale-run cap a live run is bound by', async () => {
    listTenantsByIdsMock.mockResolvedValue([
      makeTenant({ deprovisioningSteps: null }),
    ]);
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(
      new Date('2026-08-12T14:18:00.000Z'),
    );
    getTenantDeprovisioningStatusActionMock.mockResolvedValue({
      deprovisioningSteps: null,
      deprovisionedAt: null,
    });

    await setup();

    for (let tick = 0; tick < STALE_RUN_MAX_TICKS + 5; tick += 1) {
      await act(async () => {
        await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
      });
    }

    expect(getTenantDeprovisioningStatusActionMock).toHaveBeenCalledTimes(
      STALE_RUN_MAX_TICKS,
    );
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
