import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  idleDeprovisioningSteps,
  makeTenant,
  REACTIVATE_TENANT_LABEL,
  TENANT_ID,
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
  params: Promise.resolve({ tenantId: TENANT_ID }),
});

const NEXT_HTTP_ERROR_FALLBACK_404 = 'NEXT_HTTP_ERROR_FALLBACK;404';
const AT_20260812_1418 = '2026-08-12T14:18:00.000Z';
const AT_20260410_0000 = '2026-04-10T00:00:00.000Z';
const DEPROVISION_THIS_TENANT = 'Deprovision this tenant';
const DEPROVISIONING_PROGRESS = /^Deprovisioning progress/;
const TEARDOWN_HISTORY = 'Teardown history';

describe(TenantDangerPage, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    requireSuperAdminMock.mockReset();
    requireSuperAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.SUPERADMIN,
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
    requireSuperAdminMock.mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(requireTenantByIdMock).not.toHaveBeenCalled();
  });

  it('renders the deprovisioning control for a permitted superadmin', async () => {
    await setup();

    expect(requireSuperAdminMock).toHaveBeenCalled();
    expect(requireTenantByIdMock).toHaveBeenCalledWith(TENANT_ID);

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Danger zone',
    });
    const deprovisionButton = screen.getByRole('button', {
      name: 'Deprovision',
    });

    expect(heading).toBeVisible();
    expect(deprovisionButton).toBeVisible();
  });

  it('never queries the deprovision request when the tenant does not exist', async () => {
    requireTenantByIdMock.mockRejectedValue(
      new Error(NEXT_HTTP_ERROR_FALLBACK_404),
    );

    await expect(setup()).rejects.toThrow(NEXT_HTTP_ERROR_FALLBACK_404);

    expect(getLatestDeprovisionRequestedAtMock).not.toHaveBeenCalled();
  });

  it("passes the tenant's latest deprovision request through, so a pending request shows the starting state", async () => {
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(
      new Date(AT_20260812_1418),
    );

    await setup();

    const startingText = screen.getByText('Starting…');

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(TENANT_ID);
    expect(startingText).toBeVisible();
  });

  it('never offers reactivation for a live tenant', async () => {
    await setup();

    const reactivateButton = screen.queryByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });

    expect(reactivateButton).not.toBeInTheDocument();
  });

  it('offers reactivation for an already-deprovisioned tenant', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({
        deprovisionedAt: new Date(AT_20260410_0000),
      }),
    });

    await setup();

    const reactivateButton = screen.getByRole('button', {
      name: REACTIVATE_TENANT_LABEL,
    });

    expect(reactivateButton).toBeVisible();
  });

  it('renders the deprovisioning progress card once a run exists', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: { startedAt: AT_20260812_1418 },
        },
      }),
    });

    await setup();

    const progressHeading = screen.getByRole('heading', {
      name: DEPROVISIONING_PROGRESS,
    });

    expect(progressHeading).toBeVisible();
  });

  it('renders no deprovisioning progress card when deprovisioningSteps carries no run marker', async () => {
    requireTenantByIdMock.mockResolvedValue({
      tenant: makeTenant({ deprovisioningSteps: idleDeprovisioningSteps() }),
    });

    await setup();

    const progressHeading = screen.queryByRole('heading', {
      name: DEPROVISIONING_PROGRESS,
    });

    expect(progressHeading).not.toBeInTheDocument();
  });

  describe('live-tenant reading order (scope guard: unaffected by the archived reorganisation)', () => {
    it('reads header, then the Deprovision card, with no archived notice or history heading', async () => {
      await setup();

      const deprovisionHeading = screen.getByRole('heading', {
        level: 2,
        name: DEPROVISION_THIS_TENANT,
      });
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);
      const historyHeading = screen.queryByRole('heading', {
        name: TEARDOWN_HISTORY,
      });

      expect(deprovisionHeading).toBeVisible();
      expect(archivedNotice).not.toBeInTheDocument();
      expect(historyHeading).not.toBeInTheDocument();
    });
  });

  describe('archived-tenant reorganisation', () => {
    const archivedTenant = () =>
      makeTenant({
        deprovisionedAt: new Date(AT_20260410_0000),
        deprovisioningSteps: {
          ...idleDeprovisioningSteps(),
          run: {
            startedAt: AT_20260812_1418,
            finishedAt: '2026-08-12T14:20:00.000Z',
          },
        },
      });

    it('shows the archived notice, an action row with both controls, and a Teardown history section', async () => {
      requireTenantByIdMock.mockResolvedValue({ tenant: archivedTenant() });

      await setup();

      const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
      const reactivateHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Reactivate this tenant',
      });
      const deleteHeading = screen.getByRole('heading', {
        level: 2,
        name: 'Delete this tenant permanently',
      });
      const deprovisionHeading = screen.queryByRole('heading', {
        name: DEPROVISION_THIS_TENANT,
      });
      const historyHeading = screen.getByRole('heading', {
        name: TEARDOWN_HISTORY,
      });
      const progressHeading = screen.getByRole('heading', {
        name: DEPROVISIONING_PROGRESS,
      });

      expect(archivedNotice).toBeVisible();
      expect(reactivateHeading).toBeVisible();
      expect(deleteHeading).toBeVisible();
      expect(deprovisionHeading).not.toBeInTheDocument();
      expect(historyHeading).toBeVisible();
      expect(progressHeading).toBeVisible();
    });

    it('renders no Teardown history section when the tenant has never been through a deprovisioning run', async () => {
      requireTenantByIdMock.mockResolvedValue({
        tenant: makeTenant({
          deprovisionedAt: new Date(AT_20260410_0000),
          deprovisioningSteps: null,
        }),
      });

      await setup();

      const historyHeading = screen.queryByRole('heading', {
        name: TEARDOWN_HISTORY,
      });

      expect(historyHeading).not.toBeInTheDocument();
    });
  });
});
