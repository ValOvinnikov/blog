import { ACTION_OUTCOME, AUDIT_TARGET_TYPE } from '@blog/config';
import { FINDING_STATUS } from '@blog/config/constants';
import {
  ADMIN_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import type { TTenantProvisioningState } from '@blog/db/schema/tenants';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import { makeAuditEvent } from '@platform/testing/audit-events/fixtures';
import {
  act,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  idleProvisioningSteps,
  makeTenant,
} from '@platform/testing/tenants/fixtures';

import { TenantOverviewView } from './tenant-overview-view';

const STEP_POLL_INTERVAL_MS = 4000;

const {
  retryProvisioningStepActionMock,
  getTenantProvisioningStatusActionMock,
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
  requireAdminMock,
} = vi.hoisted(() => ({
  retryProvisioningStepActionMock: vi.fn(),
  getTenantProvisioningStatusActionMock: vi.fn(),
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  requireAdminMock: vi.fn(),
}));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerMembership: getTenantOwnerMembershipMock },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    findings: { listFindingsForTenant: listFindingsForTenantMock },
  },
}));

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/tenants/tenant-suspension-actions', () => ({
  suspendTenantAction: vi.fn(),
  liftTenantSuspensionAction: vi.fn(),
}));

vi.mock('@platform/server/provisioning/get-domain-verification-status', () => ({
  getDomainVerificationStatus: getDomainVerificationStatusMock,
}));

vi.mock(
  '@platform/server/provisioning/get-domain-verification-status-action',
  () => ({
    getDomainVerificationStatusAction: vi.fn(),
  }),
);

vi.mock('@platform/server/provisioning/retry-provisioning-step-action', () => ({
  retryProvisioningStepAction: retryProvisioningStepActionMock,
}));

vi.mock(
  '@platform/server/provisioning/get-tenant-provisioning-status-action',
  () => ({
    getTenantProvisioningStatusAction: getTenantProvisioningStatusActionMock,
  }),
);

vi.mock('@platform/server/findings/get-finding-details-action', () => ({
  getFindingDetailsAction: vi.fn(),
}));

vi.mock('@platform/server/tenants/update-tenant-details-action', () => ({
  updateTenantDetailsAction: vi.fn(),
}));

const setup = async ({ tenant = makeTenant() } = {}) => {
  const ui = await TenantOverviewView({ tenant });
  await act(async () => {
    renderWithIntl(ui);
  });
};

describe(`<${TenantOverviewView.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    retryProvisioningStepActionMock.mockResolvedValue({
      outcome: ACTION_OUTCOME.SUCCESS,
    });
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockResolvedValue(undefined);
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'owner@example.com',
      joinedAt: new Date('2026-08-12T00:00:00.000Z'),
    });
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockReset();
    listFindingsForTenantMock.mockResolvedValue([]);
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({
      id: 'admin-1',
      role: ADMIN_ROLE.SUPERADMIN,
    });
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the tenant name and status/plan badges', async () => {
    await setup({
      tenant: makeTenant({ name: 'Acme Inc.', status: TENANT_STATUS.ACTIVE }),
    });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: 'Acme Inc.',
    });
    const titleRow = screen.getByTestId('page-header-title-row');
    const statusBadge = within(titleRow).getByText('Active');
    const planBadge = within(titleRow).getByText('Free');

    expect(heading).toBeVisible();
    expect(statusBadge).toBeVisible();
    expect(planBadge).toBeVisible();
  });

  it("nests every card's title one level under the page's h1, with no h3", async () => {
    await setup();

    const cardTitles = [
      'Tenant details',
      'Domain',
      'Owner',
      'Content workspace',
      'Recent activity',
      'Open findings',
    ].map((name) => screen.getByRole('heading', { level: 2, name }));
    const thirdLevelHeading = screen.queryByRole('heading', { level: 3 });

    for (const cardTitle of cardTitles) {
      expect(cardTitle).toBeVisible();
    }
    expect(thirdLevelHeading).not.toBeInTheDocument();
  });

  it('renders the provisioning banner', async () => {
    await setup({
      tenant: makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
        provisioningSteps: Object.fromEntries(
          Object.values(TENANT_PROVISIONING_STEP).map((step) => [
            step,
            { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
          ]),
        ) as unknown as TTenantProvisioningState,
      }),
    });

    const banner = screen.getByText('Provisioned');
    expect(banner).toBeVisible();
  });

  it('relocates the tenant details panel here as the Identity card', async () => {
    await setup({ tenant: makeTenant({ name: 'Acme Inc.' }) });

    const detailsTitle = screen.getByText('Tenant details');
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(detailsTitle).toBeVisible();
    expect(nameInput).toHaveValue('Acme Inc.');
  });

  it('locks every tenant details field while a step is running, saying why', async () => {
    await setup({
      tenant: makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
          },
        },
      }),
    });

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const saveButton = screen.getByRole('button', { name: 'Save changes' });

    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );
    expect(saveButton).toBeDisabled();
  });

  it('locks primaryDomain once MAP_DOMAIN is done and a later step failed', async () => {
    await setup({
      tenant: makeTenant({
        provisioningSteps: {
          ...idleProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          [TENANT_PROVISIONING_STEP.PERSIST_TOKEN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          [TENANT_PROVISIONING_STEP.MAP_DOMAIN]: {
            status: TENANT_PROVISIONING_STEP_STATUS.DONE,
          },
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: 'boom',
          },
        },
      }),
    });

    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      'Locked — the "Connect domain" step has already completed and used this value.',
    );
    expect(nameInput).not.toBeDisabled();
  });

  it('locks every field once a dispatch begins, before any step reports', async () => {
    await setup({
      tenant: makeTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: idleProvisioningSteps(),
      }),
    });

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const domainInput = screen.getByRole('textbox', {
      name: 'Primary domain',
    });

    expect(nameInput).toBeDisabled();
    expect(domainInput).toBeDisabled();
  });

  it('keeps the provisioning banner and details panel in sync off one poll', async () => {
    const tenant = makeTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...idleProvisioningSteps(),
        [TENANT_PROVISIONING_STEP.SANITY_PROJECT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        },
        [TENANT_PROVISIONING_STEP.SEED_CONTENT]: {
          status: TENANT_PROVISIONING_STEP_STATUS.RUNNING,
        },
      },
    });
    getTenantProvisioningStatusActionMock.mockResolvedValue({
      provisioningStatus: TENANT_PROVISIONING_STATUS.READY,
      provisioningSteps: Object.fromEntries(
        Object.values(TENANT_PROVISIONING_STEP).map((step) => [
          step,
          { status: TENANT_PROVISIONING_STEP_STATUS.DONE },
        ]),
      ) as unknown as TTenantProvisioningState,
    });

    await setup({ tenant });

    const runningBanner = screen.getByText('Provisioning — step 2 of 6');
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(runningBanner).toBeVisible();
    expect(nameInput).toHaveAccessibleDescription(
      'Locked while provisioning is running.',
    );

    await act(async () => {
      await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
    });

    const doneBanner = screen.getByText('Provisioned');
    const lockedNameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(doneBanner).toBeVisible();
    expect(lockedNameInput).toHaveAccessibleDescription(
      'Locked — provisioning has already finished.',
    );
  });

  it("fills each fact card from the tenant's owner, activity, findings and domain", async () => {
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.VERIFIED,
    );
    listAuditEventsForTargetMock.mockResolvedValue([makeAuditEvent()]);
    listFindingsForTenantMock.mockResolvedValue([makeFinding()]);

    await setup({
      tenant: makeTenant({
        id: 'tenant-1',
        primaryDomain: 'acme.example.com',
        sanityProjectId: 'proj-1',
      }),
    });

    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      'tenant-1',
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      'tenant-1',
      { limit: 5 },
    );
    expect(listFindingsForTenantMock).toHaveBeenCalledWith(
      'tenant-1',
      FINDING_STATUS.OPEN,
    );
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      'acme.example.com',
    );

    const domainStatus = screen.getByText('Verified');
    const ownerJoinedAt = screen.getByText('Aug 12, 2026');
    const sanityProject = screen.getByText('proj-1');
    const activityActor = screen.getByText('vo@valstack.dev');
    const finding = screen.getByText('Provisioning step failed');

    expect(domainStatus).toBeVisible();
    expect(ownerJoinedAt).toBeVisible();
    expect(sanityProject).toBeVisible();
    expect(activityActor).toBeVisible();
    expect(finding).toBeVisible();
  });

  it('shows a pending invite email in both the owner card and details panel', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: 'invited@example.com',
    });

    await setup();

    const ownerEmail = screen.getByText('invited@example.com');
    const ownerEmailInput = screen.getByRole('textbox', {
      name: 'Owner email',
    });
    const joinedLabel = screen.queryByText('Joined');

    expect(ownerEmail).toBeVisible();
    expect(ownerEmailInput).toHaveValue('invited@example.com');
    expect(joinedLabel).not.toBeInTheDocument();
  });

  it('always renders "Open site", linking to the tenant\'s live domain', async () => {
    await setup({ tenant: makeTenant({ primaryDomain: 'acme.example.com' }) });

    const link = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', 'https://acme.example.com');
    expect(link).toHaveAttribute('target', '_blank');
  });

  it('never renders an "Open Studio" action — Studio opens from the sidebar', async () => {
    await setup();

    const openStudioLink = screen.queryByRole('link', {
      name: 'Open Studio →',
    });
    expect(openStudioLink).not.toBeInTheDocument();
  });

  describe('archived tenant', () => {
    const archivedTenant = makeTenant({
      deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
    });

    beforeEach(async () => {
      await setup({ tenant: archivedTenant });
    });

    it('shows the archived notice', async () => {
      const archivedNotice = screen.getByText('This tenant is archived');
      expect(archivedNotice).toBeVisible();
    });

    it("describes the details panel's disabled Save with the archived notice", async () => {
      const saveButton = screen.getByRole('button', { name: 'Save changes' });
      expect(saveButton).toHaveAccessibleDescription(/This tenant is archived/);
    });
  });

  it('does not show the archived notice for a live tenant', async () => {
    await setup({ tenant: makeTenant({ deprovisionedAt: null }) });

    const archivedNotice = screen.queryByText('This tenant is archived');
    expect(archivedNotice).not.toBeInTheDocument();
  });

  describe('suspension', () => {
    it('offers a super admin the Suspend action on an active tenant', async () => {
      await setup({ tenant: makeTenant({ status: TENANT_STATUS.ACTIVE }) });

      const suspendButton = screen.getByRole('button', {
        name: 'Suspend tenant',
      });
      expect(suspendButton).toBeVisible();
    });

    it('offers a super admin the Reactivate action on a suspended tenant', async () => {
      await setup({ tenant: makeTenant({ status: TENANT_STATUS.SUSPENDED }) });

      const reactivateButton = screen.getByRole('button', {
        name: 'Reactivate tenant',
      });
      const suspendButton = screen.queryByRole('button', {
        name: 'Suspend tenant',
      });

      expect(reactivateButton).toBeVisible();
      expect(suspendButton).not.toBeInTheDocument();
    });

    it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
      'offers neither action to a %s',
      async (role) => {
        requireAdminMock.mockResolvedValue({ id: 'admin-1', role });

        await setup({
          tenant: makeTenant({ status: TENANT_STATUS.SUSPENDED }),
        });

        const reactivateButton = screen.queryByRole('button', {
          name: 'Reactivate tenant',
        });
        expect(reactivateButton).not.toBeInTheDocument();
      },
    );

    it('offers neither action on an archived tenant', async () => {
      await setup({
        tenant: makeTenant({
          status: TENANT_STATUS.ARCHIVED,
          deprovisionedAt: new Date('2026-08-26T00:00:00.000Z'),
        }),
      });

      const suspendButton = screen.queryByRole('button', {
        name: 'Suspend tenant',
      });
      const reactivateButton = screen.queryByRole('button', {
        name: 'Reactivate tenant',
      });

      expect(suspendButton).not.toBeInTheDocument();
      expect(reactivateButton).not.toBeInTheDocument();
    });
  });
});
