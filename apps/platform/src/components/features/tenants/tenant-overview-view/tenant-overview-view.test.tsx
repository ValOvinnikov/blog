import { AUDIT_TARGET_TYPE } from '@blog/config';
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
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import {
  makeAuditEvent,
  MOCK_AUDIT_ACTOR_EMAIL,
} from '@platform/testing/audit-events/fixtures';
import {
  act,
  renderWithIntl,
  screen,
  within,
} from '@platform/testing/custom-render';
import { makeFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { ARCHIVED_NOTICE_TEXT } from '@platform/testing/render-in-settings-form';
import {
  idleProvisioningSteps,
  makeTenant,
  MOCK_ARCHIVED_AT,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_OWNER_JOINED_AT,
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_URL,
  mockFirstStepRunningProvisioningSteps,
  TENANT_ID,
} from '@platform/testing/tenants/fixtures';

import { TenantOverviewView } from './tenant-overview-view';

const STEP_POLL_INTERVAL_MS = 4000;

const {
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
  requireAdminMock,
} = vi.hoisted(() => ({
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

vi.mock('@platform/server/provisioning/retry-provisioning-step-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

const retryProvisioningStepActionMock = vi.mocked(retryProvisioningStepAction);
const getTenantProvisioningStatusActionMock = vi.mocked(
  getTenantProvisioningStatusAction,
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

const TENANT_DETAILS = 'Tenant details';
const SAVE_CHANGES = 'Save changes';
const LOCKED_WHILE_PROVISIONING_IS_RUNNING =
  'Locked while provisioning is running.';
const PRIMARY_DOMAIN = 'Primary domain';
const SUSPEND_TENANT = 'Suspend tenant';
const REACTIVATE_TENANT = 'Reactivate tenant';

describe(`<${TenantOverviewView.name}/>`, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: MOCK_OWNER_EMAIL,
      joinedAt: MOCK_OWNER_JOINED_AT,
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
      tenant: makeTenant({
        name: MOCK_TENANT_NAME,
        status: TENANT_STATUS.ACTIVE,
      }),
    });

    const heading = screen.getByRole('heading', {
      level: 1,
      name: MOCK_TENANT_NAME,
    });
    const titleRow = screen.getByTestId('page-header-title-row');
    const statusBadge = within(titleRow).getByText('Active');
    const planBadge = within(titleRow).getByText('Free');

    expect(heading).toBeVisible();
    expect(statusBadge).toBeVisible();
    expect(planBadge).toBeVisible();
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
    await setup({ tenant: makeTenant({ name: MOCK_TENANT_NAME }) });

    const detailsTitle = screen.getByText(TENANT_DETAILS);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(detailsTitle).toBeVisible();
    expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
  });

  it('locks every tenant details field while a step is running, saying why', async () => {
    await setup({
      tenant: makeTenant({
        provisioningSteps: mockFirstStepRunningProvisioningSteps(),
      }),
    });

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

    expect(nameInput).toBeDisabled();
    expect(nameInput).toHaveAccessibleDescription(
      LOCKED_WHILE_PROVISIONING_IS_RUNNING,
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
      name: PRIMARY_DOMAIN,
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
      name: PRIMARY_DOMAIN,
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
      LOCKED_WHILE_PROVISIONING_IS_RUNNING,
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
        id: TENANT_ID,
        primaryDomain: MOCK_TENANT_DOMAIN,
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
      }),
    });

    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      TENANT_ID,
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      TENANT_ID,
      { limit: 5 },
    );
    expect(listFindingsForTenantMock).toHaveBeenCalledWith(
      TENANT_ID,
      FINDING_STATUS.OPEN,
    );
    expect(getDomainVerificationStatusMock).toHaveBeenCalledWith(
      MOCK_TENANT_DOMAIN,
    );

    const domainStatus = screen.getByText('Verified');
    const ownerJoinedAt = screen.getByText('Aug 12, 2026');
    const sanityProject = screen.getByText(MOCK_SANITY_PROJECT_ID);
    const activityActor = screen.getByText(MOCK_AUDIT_ACTOR_EMAIL);
    const finding = screen.getByText('Provisioning step failed');

    expect(domainStatus).toBeVisible();
    expect(ownerJoinedAt).toBeVisible();
    expect(sanityProject).toBeVisible();
    expect(activityActor).toBeVisible();
    expect(finding).toBeVisible();
  });

  it('shows a pending invite email in both the owner card and details panel', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue({
      email: MOCK_INVITED_OWNER_EMAIL,
    });

    await setup();

    const ownerEmail = screen.getByText(MOCK_INVITED_OWNER_EMAIL);
    const ownerEmailInput = screen.getByRole('textbox', {
      name: 'Owner email',
    });
    const joinedLabel = screen.queryByText('Joined');

    expect(ownerEmail).toBeVisible();
    expect(ownerEmailInput).toHaveValue(MOCK_INVITED_OWNER_EMAIL);
    expect(joinedLabel).not.toBeInTheDocument();
  });

  it('always renders "Open site", linking to the tenant\'s live domain', async () => {
    await setup({ tenant: makeTenant() });

    const link = screen.getByRole('link', {
      name: 'Open site (opens in new tab)',
    });
    expect(link).toHaveAttribute('href', MOCK_TENANT_URL);
    expect(link).toHaveAttribute('target', '_blank');
  });

  describe('with the default tenant', () => {
    beforeEach(async () => {
      await setup();
    });

    it("nests every card's title one level under the page's h1, with no h3", () => {
      const cardTitles = [
        TENANT_DETAILS,
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

    it('never renders an "Open Studio" action — Studio opens from the sidebar', () => {
      const openStudioLink = screen.queryByRole('link', {
        name: 'Open Studio →',
      });
      expect(openStudioLink).not.toBeInTheDocument();
    });
  });

  describe('archived tenant', () => {
    const archivedTenant = makeTenant({
      deprovisionedAt: MOCK_ARCHIVED_AT,
    });

    beforeEach(async () => {
      await setup({ tenant: archivedTenant });
    });

    it('shows the archived notice', async () => {
      const archivedNotice = screen.getByText(ARCHIVED_NOTICE_TEXT);
      expect(archivedNotice).toBeVisible();
    });

    it("describes the details panel's disabled Save with the archived notice", async () => {
      const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });
      expect(saveButton).toHaveAccessibleDescription(
        expect.stringContaining(ARCHIVED_NOTICE_TEXT),
      );
    });
  });

  it('does not show the archived notice for a live tenant', async () => {
    await setup({ tenant: makeTenant({ deprovisionedAt: null }) });

    const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);
    expect(archivedNotice).not.toBeInTheDocument();
  });

  describe('suspension', () => {
    it('offers a super admin the Suspend action on an active tenant', async () => {
      await setup({ tenant: makeTenant({ status: TENANT_STATUS.ACTIVE }) });

      const suspendButton = screen.getByRole('button', {
        name: SUSPEND_TENANT,
      });
      expect(suspendButton).toBeVisible();
    });

    it('offers a super admin the Reactivate action on a suspended tenant', async () => {
      await setup({ tenant: makeTenant({ status: TENANT_STATUS.SUSPENDED }) });

      const reactivateButton = screen.getByRole('button', {
        name: REACTIVATE_TENANT,
      });
      const suspendButton = screen.queryByRole('button', {
        name: SUSPEND_TENANT,
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
          name: REACTIVATE_TENANT,
        });
        expect(reactivateButton).not.toBeInTheDocument();
      },
    );

    it('offers neither action on an archived tenant', async () => {
      await setup({
        tenant: makeTenant({
          status: TENANT_STATUS.ARCHIVED,
          deprovisionedAt: MOCK_ARCHIVED_AT,
        }),
      });

      const suspendButton = screen.queryByRole('button', {
        name: SUSPEND_TENANT,
      });
      const reactivateButton = screen.queryByRole('button', {
        name: REACTIVATE_TENANT,
      });

      expect(suspendButton).not.toBeInTheDocument();
      expect(reactivateButton).not.toBeInTheDocument();
    });
  });
});
