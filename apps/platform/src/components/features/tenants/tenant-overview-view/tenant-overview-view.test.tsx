import { AUDIT_TARGET_TYPE } from '@blog/config';
import { FINDING_STATUS } from '@blog/config/constants';
import {
  ADMIN_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@blog/db/constants';
import { faker } from '@faker-js/faker';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
import { retryProvisioningStepAction } from '@platform/server/provisioning/retry-provisioning-step-action';
import { resolveIsPlatformTenant } from '@platform/server/tenants/resolve-is-platform-tenant';
import {
  mockAuditEvent,
  MOCK_AUDIT_ACTOR_EMAIL,
} from '@platform/testing/audit-events/fixtures';
import {
  act,
  customRenderAsync,
  screen,
  within,
} from '@platform/testing/custom-render';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import {
  ARCHIVED_NOTICE_DESCRIPTION,
  ARCHIVED_NOTICE_TEXT,
  SAVE_CHANGES,
} from '@platform/testing/render-in-settings-form';
import {
  mockDoneProvisioningSteps,
  mockIdleProvisioningSteps,
  mockTenant,
  MOCK_ARCHIVED_AT,
  MOCK_INVITED_OWNER_EMAIL,
  MOCK_SANITY_PROJECT_ID,
  MOCK_CUSTOM_DOMAIN,
  MOCK_TENANT_DOMAIN,
  MOCK_TENANT_NAME,
  MOCK_TENANT_ROOT_DOMAIN,
  MOCK_TENANT_URL,
  mockFirstStepRunningProvisioningSteps,
  PLATFORM_TENANT_NOTICE_TEXT,
  PRIMARY_DOMAIN_LABEL,
  REACTIVATE_TENANT_LABEL,
  MOCK_TENANT_ID,
  mockInvitedOwner,
  mockJoinedOwner,
} from '@platform/testing/tenants/fixtures';
import { STEP_POLL_INTERVAL_MS } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';

import { TenantOverviewView } from './tenant-overview-view';

faker.seed(7319);

const MOCK_ADMIN_ID = faker.string.uuid();
const MOCK_STEP_ERROR = faker.lorem.sentence();

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

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/auth/require-admin', () => ({
  requireAdmin: requireAdminMock,
}));

vi.mock('@platform/server/tenants/resolve-is-platform-tenant');

const resolveIsPlatformTenantMock = vi.mocked(resolveIsPlatformTenant);

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

const setup = customRenderAsync(TenantOverviewView, {
  tenant: mockTenant(),
});

const advancePoll = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
  });
};

const TENANT_DETAILS = 'Tenant details';
const LOCKED_WHILE_PROVISIONING_IS_RUNNING =
  'Locked while provisioning is running.';
const SUSPEND_TENANT = 'Suspend tenant';

describe(`<${TenantOverviewView.name}/>`, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    retryProvisioningStepActionMock.mockReset();
    getTenantProvisioningStatusActionMock.mockReset();
    getTenantOwnerMembershipMock.mockReset();
    getTenantOwnerMembershipMock.mockResolvedValue(mockJoinedOwner());
    listAuditEventsForTargetMock.mockReset();
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockReset();
    listFindingsForTenantMock.mockResolvedValue([]);
    requireAdminMock.mockReset();
    requireAdminMock.mockResolvedValue({
      id: MOCK_ADMIN_ID,
      role: ADMIN_ROLE.SUPERADMIN,
    });
    getDomainVerificationStatusMock.mockReset();
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
    resolveIsPlatformTenantMock.mockReset().mockResolvedValue(false);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the tenant name and status/plan badges', async () => {
    await setup({
      tenant: mockTenant({
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

  it('relocates the tenant details panel here as the Identity card', async () => {
    await setup({ tenant: mockTenant({ name: MOCK_TENANT_NAME }) });

    const detailsTitle = screen.getByText(TENANT_DETAILS);
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(detailsTitle).toBeVisible();
    expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
  });

  it('locks the tenant details while a step runs, saying why', async () => {
    await setup({
      tenant: mockTenant({
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

  it('locks the domain once it is connected and a later step failed', async () => {
    await setup({
      tenant: mockTenant({
        provisioningSteps: {
          ...mockDoneProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: MOCK_STEP_ERROR,
          },
        },
      }),
    });

    const domainInput = screen.getByRole('textbox', {
      name: PRIMARY_DOMAIN_LABEL,
    });
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      'Locked — the "Connect domain" step has already completed and used this value.',
    );
    expect(nameInput).not.toBeDisabled();
  });

  it('locks the domain and points to the Domain page while the main address is the custom domain', async () => {
    await setup({ tenant: mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }) });

    const domainInput = screen.getByRole('textbox', {
      name: PRIMARY_DOMAIN_LABEL,
    });
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(domainInput).toBeDisabled();
    expect(domainInput).toHaveAccessibleDescription(
      en.tenantDetailsPanel.fieldLockedReasonCustomMainDomain,
    );
    expect(nameInput).not.toBeDisabled();
  });

  it('locks every field once provisioning begins, before any step reports', async () => {
    await setup({
      tenant: mockTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      }),
    });

    const nameInput = screen.getByRole('textbox', { name: 'Name' });
    const domainInput = screen.getByRole('textbox', {
      name: PRIMARY_DOMAIN_LABEL,
    });

    expect(nameInput).toBeDisabled();
    expect(domainInput).toBeDisabled();
  });

  it('keeps the provisioning banner and details panel in sync on each poll', async () => {
    const tenant = mockTenant({
      provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
      provisioningSteps: {
        ...mockIdleProvisioningSteps(),
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
      provisioningSteps: mockDoneProvisioningSteps(),
    });

    await setup({ tenant });

    const runningBanner = screen.getByText('Provisioning — step 2 of 6');
    const nameInput = screen.getByRole('textbox', { name: 'Name' });

    expect(runningBanner).toBeVisible();
    expect(nameInput).toHaveAccessibleDescription(
      LOCKED_WHILE_PROVISIONING_IS_RUNNING,
    );

    await advancePoll();

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
    listAuditEventsForTargetMock.mockResolvedValue([mockAuditEvent()]);
    listFindingsForTenantMock.mockResolvedValue([mockFinding()]);

    await setup({
      tenant: mockTenant({
        id: MOCK_TENANT_ID,
        primaryDomain: MOCK_TENANT_DOMAIN,
        sanityProjectId: MOCK_SANITY_PROJECT_ID,
      }),
    });

    expect(getTenantOwnerMembershipMock).toHaveBeenCalledExactlyOnceWith(
      MOCK_TENANT_ID,
    );
    expect(listAuditEventsForTargetMock).toHaveBeenCalledWith(
      AUDIT_TARGET_TYPE.TENANT,
      MOCK_TENANT_ID,
      { limit: 5 },
    );
    expect(listFindingsForTenantMock).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
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

  it('shows a pending invite email in the owner card and details panel', async () => {
    getTenantOwnerMembershipMock.mockResolvedValue(mockInvitedOwner());

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

  it('links Open site to the tenant live domain', async () => {
    await setup({ tenant: mockTenant() });

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

    it('offers no Open Studio action', () => {
      const openStudioLink = screen.queryByRole('link', {
        name: 'Open Studio →',
      });
      expect(openStudioLink).not.toBeInTheDocument();
    });
  });

  describe('archived tenant', () => {
    const archivedTenant = mockTenant({
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
        ARCHIVED_NOTICE_DESCRIPTION,
      );
    });
  });

  it('does not show the archived notice for a live tenant', async () => {
    await setup({ tenant: mockTenant({ deprovisionedAt: null }) });

    const archivedNotice = screen.queryByText(ARCHIVED_NOTICE_TEXT);
    expect(archivedNotice).not.toBeInTheDocument();
  });

  describe('suspension', () => {
    it('offers a super admin Suspend on an active tenant', async () => {
      await setup({ tenant: mockTenant({ status: TENANT_STATUS.ACTIVE }) });

      const suspendButton = screen.getByRole('button', {
        name: SUSPEND_TENANT,
      });
      expect(suspendButton).toBeVisible();
    });

    it('offers a super admin Reactivate on a suspended tenant', async () => {
      await setup({ tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }) });

      const reactivateButton = screen.getByRole('button', {
        name: REACTIVATE_TENANT_LABEL,
      });
      const suspendButton = screen.queryByRole('button', {
        name: SUSPEND_TENANT,
      });

      expect(reactivateButton).toBeVisible();
      expect(suspendButton).not.toBeInTheDocument();
    });

    it('offers no Suspend on the platform tenant, and says why', async () => {
      resolveIsPlatformTenantMock.mockResolvedValue(true);

      await setup({ tenant: mockTenant({ status: TENANT_STATUS.ACTIVE }) });

      const suspendButton = screen.queryByRole('button', {
        name: SUSPEND_TENANT,
      });
      const notice = screen.getByText(PLATFORM_TENANT_NOTICE_TEXT);

      expect(suspendButton).not.toBeInTheDocument();
      expect(notice).toBeVisible();
    });

    it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
      'never reads the tenant hosts for a %s',
      async (role) => {
        requireAdminMock.mockResolvedValue({ id: MOCK_ADMIN_ID, role });

        await setup({ tenant: mockTenant({ status: TENANT_STATUS.ACTIVE }) });

        expect(resolveIsPlatformTenantMock).not.toHaveBeenCalled();
      },
    );

    it('still offers Reactivate on a suspended platform tenant', async () => {
      resolveIsPlatformTenantMock.mockResolvedValue(true);

      await setup({ tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }) });

      const reactivateButton = screen.getByRole('button', {
        name: REACTIVATE_TENANT_LABEL,
      });
      expect(reactivateButton).toBeVisible();
    });

    it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
      'offers no Reactivate to a %s',
      async (role) => {
        requireAdminMock.mockResolvedValue({ id: MOCK_ADMIN_ID, role });

        await setup({
          tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }),
        });

        const reactivateButton = screen.queryByRole('button', {
          name: REACTIVATE_TENANT_LABEL,
        });
        expect(reactivateButton).not.toBeInTheDocument();
      },
    );

    it('offers neither action on an archived tenant', async () => {
      await setup({
        tenant: mockTenant({
          status: TENANT_STATUS.ARCHIVED,
          deprovisionedAt: MOCK_ARCHIVED_AT,
        }),
      });

      const suspendButton = screen.queryByRole('button', {
        name: SUSPEND_TENANT,
      });
      const reactivateButton = screen.queryByRole('button', {
        name: REACTIVATE_TENANT_LABEL,
      });

      expect(suspendButton).not.toBeInTheDocument();
      expect(reactivateButton).not.toBeInTheDocument();
    });
  });
});
