import { NEXT_NAVIGATION_ERROR } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import messages from '@platform/i18n/messages/en.json';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  MOCK_ARCHIVED_AT,
  MOCK_RUN_PLUS_2_MIN_AT,
  MOCK_RUN_STARTED_AT,
  MOCK_TENANT_ID,
  mockIdleDeprovisioningSteps,
  mockTenant,
} from '@platform/testing/tenants/fixtures';

import TenantDangerPage from './page';

const {
  requireSuperAdminMock,
  requireTenantByIdMock,
  getLatestDeprovisionRequestedAtMock,
} = vi.hoisted(() => ({
  requireSuperAdminMock: vi.fn(),
  requireTenantByIdMock: vi.fn(),
  getLatestDeprovisionRequestedAtMock: vi.fn(),
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

vi.mock('@platform/server/tenants/resolve-is-platform-tenant');

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
    getTenantDeprovisioningStatusAction: vi.fn(async () => undefined),
  }),
);

const {
  tenantDangerPage,
  deprovisionTenantControl,
  reactivateTenantControl,
  deprovisioningStatusView,
  tenantLifecycleErrors,
  runStatus,
} = messages;

const DEPROVISIONING_PROGRESS = new RegExp(
  `^${deprovisioningStatusView.cardTitle}`,
);

const MOCK_STARTED_RUN_STEPS = {
  ...mockIdleDeprovisioningSteps(),
  run: { startedAt: MOCK_RUN_STARTED_AT },
};

const setup = customRenderAsync(TenantDangerPage, {
  params: Promise.resolve({ tenantId: MOCK_TENANT_ID }),
});

describe(`<${TenantDangerPage.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    requireSuperAdminMock.mockResolvedValue(
      mockAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );
    requireTenantByIdMock.mockResolvedValue({ tenant: mockTenant() });
    getLatestDeprovisionRequestedAtMock.mockResolvedValue(undefined);
    vi.mocked(resolveIsPlatformTenant).mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('never reads the tenant for a caller who is not a superadmin', async () => {
    requireSuperAdminMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(requireTenantByIdMock).not.toHaveBeenCalled();
  });

  it('never reads the deprovision request for an unknown tenant', async () => {
    requireTenantByIdMock.mockRejectedValueOnce(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);

    expect(getLatestDeprovisionRequestedAtMock).not.toHaveBeenCalled();
  });

  it('shows the starting state for a pending deprovision request', async () => {
    getLatestDeprovisionRequestedAtMock.mockResolvedValueOnce(
      new Date(MOCK_RUN_STARTED_AT),
    );

    await setup();

    const startingBadge = screen.getByText(runStatus.startingBadge);

    expect(getLatestDeprovisionRequestedAtMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
    );
    expect(startingBadge).toBeVisible();
  });

  it('offers no Deprovision control for the platform tenant, and says why', async () => {
    vi.mocked(resolveIsPlatformTenant).mockResolvedValue(true);

    await setup();

    const deprovisionButton = screen.queryByRole('button', {
      name: deprovisionTenantControl.triggerButton,
    });
    const notice = screen.getByText(tenantLifecycleErrors.platformTenant);

    expect(deprovisionButton).not.toBeInTheDocument();
    expect(notice).toBeVisible();
  });

  describe('for a live tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it('renders the danger zone of the requested tenant', () => {
      const heading = screen.getByRole('heading', {
        level: 1,
        name: tenantDangerPage.title,
      });

      expect(requireTenantByIdMock).toHaveBeenCalledWith(MOCK_TENANT_ID);
      expect(heading).toBeVisible();
    });

    it('offers only the Deprovision control, with no archived notice or history', () => {
      const deprovisionHeading = screen.getByRole('heading', {
        level: 2,
        name: deprovisionTenantControl.cardTitle,
      });
      const deprovisionButton = screen.getByRole('button', {
        name: deprovisionTenantControl.triggerButton,
      });
      const reactivateButton = screen.queryByRole('button', {
        name: reactivateTenantControl.triggerButton,
      });
      const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);
      const historyHeading = screen.queryByRole('heading', {
        name: tenantDangerPage.historyHeading,
      });

      expect(deprovisionHeading).toBeVisible();
      expect(deprovisionButton).toBeVisible();
      expect(reactivateButton).not.toBeInTheDocument();
      expect(archivedNotice).not.toBeInTheDocument();
      expect(historyHeading).not.toBeInTheDocument();
    });
  });

  it('renders the deprovisioning progress card once a run exists', async () => {
    requireTenantByIdMock.mockResolvedValueOnce({
      tenant: mockTenant({ deprovisioningSteps: MOCK_STARTED_RUN_STEPS }),
    });

    await setup();

    const progressHeading = screen.getByRole('heading', {
      name: DEPROVISIONING_PROGRESS,
    });

    expect(progressHeading).toBeVisible();
  });

  it('renders no deprovisioning progress card before any run has started', async () => {
    requireTenantByIdMock.mockResolvedValueOnce({
      tenant: mockTenant({
        deprovisioningSteps: mockIdleDeprovisioningSteps(),
      }),
    });

    await setup();

    const progressHeading = screen.queryByRole('heading', {
      name: DEPROVISIONING_PROGRESS,
    });

    expect(progressHeading).not.toBeInTheDocument();
  });

  describe('for an archived tenant', () => {
    it('shows the archived notice, both archived controls and the teardown history', async () => {
      requireTenantByIdMock.mockResolvedValueOnce({
        tenant: mockTenant({
          deprovisionedAt: MOCK_ARCHIVED_AT,
          deprovisioningSteps: {
            ...mockIdleDeprovisioningSteps(),
            run: {
              startedAt: MOCK_RUN_STARTED_AT,
              finishedAt: MOCK_RUN_PLUS_2_MIN_AT,
            },
          },
        }),
      });

      await setup();

      const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
      const reactivateHeading = screen.getByRole('heading', {
        level: 2,
        name: reactivateTenantControl.cardTitle,
      });
      const reactivateButton = screen.getByRole('button', {
        name: reactivateTenantControl.triggerButton,
      });
      const deleteHeading = screen.getByRole('heading', {
        level: 2,
        name: deprovisionTenantControl.archivedCardTitle,
      });
      const deprovisionHeading = screen.queryByRole('heading', {
        name: deprovisionTenantControl.cardTitle,
      });
      const historyHeading = screen.getByRole('heading', {
        name: tenantDangerPage.historyHeading,
      });
      const progressHeading = screen.getByRole('heading', {
        name: DEPROVISIONING_PROGRESS,
      });

      expect(archivedNotice).toBeVisible();
      expect(reactivateHeading).toBeVisible();
      expect(reactivateButton).toBeVisible();
      expect(deleteHeading).toBeVisible();
      expect(deprovisionHeading).not.toBeInTheDocument();
      expect(historyHeading).toBeVisible();
      expect(progressHeading).toBeVisible();
    });

    it('shows no teardown history when no deprovisioning run ever happened', async () => {
      requireTenantByIdMock.mockResolvedValueOnce({
        tenant: mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      });

      await setup();

      const historyHeading = screen.queryByRole('heading', {
        name: tenantDangerPage.historyHeading,
      });

      expect(historyHeading).not.toBeInTheDocument();
    });
  });
});
