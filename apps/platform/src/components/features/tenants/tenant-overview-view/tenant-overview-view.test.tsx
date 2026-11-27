import { faker } from '@faker-js/faker';
import { ARIA_ATTRIBUTE } from '@platform/constants/aria-attribute';
import { DOMAIN_VERIFICATION_STATUS } from '@platform/constants/domain';
import en from '@platform/i18n/messages/en.json';
import { getTenantProvisioningStatusAction } from '@platform/server/provisioning/get-tenant-provisioning-status-action';
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
import {
  MOCK_NEWSLETTER_PAUSED_AT,
  MOCK_NEWSLETTER_PAUSED_ON_TEXT,
} from '@platform/testing/email/fixtures';
import { makeEnTranslator } from '@platform/testing/en-translator';
import { mockedEnv } from '@platform/testing/env/mocked-env';
import { mockFinding } from '@platform/testing/findings/fixtures';
import { mockOperatorViewer } from '@platform/testing/memberships/fixtures';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { mockRouterRefresh } from '@platform/testing/mock-router';
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
  mockListedEntitlementGrant,
} from '@platform/testing/tenants/fixtures';
import { STEP_POLL_INTERVAL_MS } from '@platform/utils/use-deprovisioning-poll/use-deprovisioning-poll';
import { AUDIT_TARGET_TYPE } from '@shinefold/config';
import { FINDING_STATUS } from '@shinefold/config/constants';
import {
  ADMIN_ROLE,
  TENANT_PROVISIONING_STATUS,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
  TENANT_STATUS,
} from '@shinefold/db/constants';
import userEvent, { type UserEvent } from '@testing-library/user-event';

import { TenantOverviewView } from './tenant-overview-view';

faker.seed(7319);

const MOCK_STEP_ERROR = faker.lorem.sentence();
const MOCK_ENCRYPTED_FORMER_OWNER_EMAIL = faker.string.alphanumeric(32);

const {
  getTenantOwnerMembershipMock,
  listAuditEventsForTargetMock,
  listFindingsForTenantMock,
  getDomainVerificationStatusMock,
  getNewsletterPausedAtMock,
  listEntitlementGrantsMock,
} = vi.hoisted(() => ({
  getTenantOwnerMembershipMock: vi.fn(),
  listAuditEventsForTargetMock: vi.fn(),
  listFindingsForTenantMock: vi.fn(),
  getDomainVerificationStatusMock: vi.fn(),
  getNewsletterPausedAtMock: vi.fn(),
  listEntitlementGrantsMock: vi.fn(),
}));

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    memberships: { getTenantOwnerMembership: getTenantOwnerMembershipMock },
    auditEvents: { listAuditEventsForTarget: listAuditEventsForTargetMock },
    findings: { listFindingsForTenant: listFindingsForTenantMock },
    emailConfig: { getNewsletterPausedAt: getNewsletterPausedAtMock },
    tenantEntitlementGrants: {
      listEntitlementGrants: listEntitlementGrantsMock,
    },
  },
}));

vi.mock('@platform/utils/env/env');

vi.mock('@platform/server/usage/load-usage-meters');

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

vi.mock('@platform/server/newsletter-pause/clear-newsletter-pause-action');

vi.mock('@platform/server/provisioning/get-tenant-provisioning-status-action');

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
  viewer: mockOperatorViewer(ADMIN_ROLE.SUPERADMIN),
});

const advancePoll = async () => {
  await act(async () => {
    await vi.advanceTimersByTimeAsync(STEP_POLL_INTERVAL_MS);
  });
};

const TENANT_DETAILS = en.tenantDetailsPanel.heading;
const LOCKED_WHILE_PROVISIONING_IS_RUNNING =
  en.tenantDetailsPanel.fieldLockedReasonRunning;
const SUSPEND_TENANT = en.tenantSuspensionControl.ACTIVE.triggerButton;
const OPEN_SITE_LINK_NAME = `${en.tenantOverviewPage.openSiteAction} ${en.externalLink.newTabHint}`;
const NAME_FIELD = { name: en.tenantDetailsPanel.nameLabel };
const UNSENT_INVITE_NOTICE = en.tenantDetailsPanel.studioInviteUnsentNotice;

describe(`<${TenantOverviewView.name}/>`, () => {
  beforeEach(() => {
    mockedEnv.TENANT_ROOT_DOMAIN = MOCK_TENANT_ROOT_DOMAIN;
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
    getTenantOwnerMembershipMock.mockResolvedValue(mockJoinedOwner());
    listAuditEventsForTargetMock.mockResolvedValue([]);
    listFindingsForTenantMock.mockResolvedValue([]);
    getDomainVerificationStatusMock.mockResolvedValue(
      DOMAIN_VERIFICATION_STATUS.NOT_CONFIGURED,
    );
    resolveIsPlatformTenantMock.mockResolvedValue(false);
    getNewsletterPausedAtMock.mockResolvedValue(undefined);
    listEntitlementGrantsMock.mockResolvedValue([]);
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
    const statusBadge = within(titleRow).getByText(
      en.tenantsTable.status.ACTIVE,
    );
    const planBadge = within(titleRow).getByText(en.planNames.FREE);

    expect(heading).toBeVisible();
    expect(statusBadge).toBeVisible();
    expect(planBadge).toBeVisible();
  });

  describe('newsletter pause', () => {
    const PAUSE_HEADING = { name: en.newsletterPauseCard.title };
    const CLEAR_PAUSE_BUTTON = {
      name: en.newsletterPauseCard.openDialogButton,
    };

    it('shows no newsletter pause for a site that is not paused', async () => {
      await setup();

      const pauseHeading = screen.queryByRole('heading', PAUSE_HEADING);

      expect(pauseHeading).not.toBeInTheDocument();
    });

    describe('on a paused site', () => {
      let user: UserEvent;

      beforeEach(() => {
        user = userEvent.setup();
        getNewsletterPausedAtMock.mockResolvedValue(MOCK_NEWSLETTER_PAUSED_AT);
      });

      it('shows the pause and its date', async () => {
        await setup();

        const pauseHeading = screen.getByRole('heading', PAUSE_HEADING);
        const pausedOn = screen.getByText(MOCK_NEWSLETTER_PAUSED_ON_TEXT);

        expect(pauseHeading).toBeVisible();
        expect(pausedOn).toBeVisible();
      });

      it('moves focus to the page heading once a super admin clears the pause', async () => {
        const refresh = mockRouterRefresh();
        await setup();

        const openDialog = screen.getByRole('button', CLEAR_PAUSE_BUTTON);
        await user.click(openDialog);
        const confirm = await screen.findByRole('button', {
          name: en.newsletterPauseCard.confirmButton,
        });
        await user.click(confirm);

        const pageHeading = screen.getByRole('heading', { level: 1 });

        expect(pageHeading).toHaveFocus();
        expect(refresh).toHaveBeenCalledTimes(1);
      });

      it('shows a moderator the pause without the clear action', async () => {
        await setup({ viewer: mockOperatorViewer(ADMIN_ROLE.MODERATOR) });

        const pausedOn = screen.getByText(MOCK_NEWSLETTER_PAUSED_ON_TEXT);
        const clearPause = screen.queryByRole('button', CLEAR_PAUSE_BUTTON);

        expect(pausedOn).toBeVisible();
        expect(clearPause).not.toBeInTheDocument();
      });
    });
  });

  describe('grants', () => {
    const GRANTS_HEADING = { name: en.grantsCard.title };
    const GRANT_MODULE_PACK = { name: en.grantModulePack.trigger };

    it('shows an operator the grants card with its empty state', async () => {
      await setup({ viewer: mockOperatorViewer(ADMIN_ROLE.MODERATOR) });

      const heading = screen.getByRole('heading', GRANTS_HEADING);
      const empty = screen.getByText(en.grantsCard.empty);
      const grantAction = screen.queryByRole('button', GRANT_MODULE_PACK);

      expect(heading).toBeVisible();
      expect(empty).toBeVisible();
      expect(grantAction).not.toBeInTheDocument();
    });

    it('lists the grants a tenant has outside its plan', async () => {
      listEntitlementGrantsMock.mockResolvedValue([
        mockListedEntitlementGrant(),
      ]);
      await setup();

      const row = screen.getByText(
        en.featuresSettings.toggleLabel.CONTACT_FORM,
      );

      expect(row).toBeVisible();
    });

    it('lets a super admin grant a module pack', async () => {
      await setup();

      const grantAction = screen.getByRole('button', GRANT_MODULE_PACK);

      expect(grantAction).toBeVisible();
    });

    it('offers a super admin no grant action on an archived tenant', async () => {
      await setup({
        tenant: mockTenant({ deprovisionedAt: MOCK_ARCHIVED_AT }),
      });

      const grantAction = screen.queryByRole('button', GRANT_MODULE_PACK);

      expect(grantAction).not.toBeInTheDocument();
    });
  });

  it('shows the unsent Studio invite notice while a re-invite is owed', async () => {
    await setup({
      tenant: mockTenant({
        unsentReinviteFormerOwnerEmailEncrypted:
          MOCK_ENCRYPTED_FORMER_OWNER_EMAIL,
      }),
    });

    const notice = screen.getByText(UNSENT_INVITE_NOTICE);

    expect(notice).toBeVisible();
  });

  it('shows no unsent Studio invite notice when no re-invite is owed', async () => {
    await setup();

    const notice = screen.queryByText(UNSENT_INVITE_NOTICE);

    expect(notice).not.toBeInTheDocument();
  });

  it('relocates the tenant details panel here as the Identity card', async () => {
    await setup({ tenant: mockTenant({ name: MOCK_TENANT_NAME }) });

    const detailsTitle = screen.getByText(TENANT_DETAILS);
    const nameInput = screen.getByRole('textbox', NAME_FIELD);

    expect(detailsTitle).toBeVisible();
    expect(nameInput).toHaveValue(MOCK_TENANT_NAME);
  });

  it('locks the tenant details while a step runs, saying why', async () => {
    await setup({
      tenant: mockTenant({
        provisioningSteps: mockFirstStepRunningProvisioningSteps(),
      }),
    });

    const nameInput = screen.getByRole('textbox', NAME_FIELD);
    const saveButton = screen.getByRole('button', { name: SAVE_CHANGES });

    expect(nameInput).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(nameInput).toHaveAccessibleDescription(
      LOCKED_WHILE_PROVISIONING_IS_RUNNING,
    );
    expect(saveButton).toBeDisabled();
  });

  it.each([
    {
      lock: 'once it is connected and a later step failed',
      tenant: mockTenant({
        provisioningSteps: {
          ...mockDoneProvisioningSteps(),
          [TENANT_PROVISIONING_STEP.CREATE_WEBHOOK]: {
            status: TENANT_PROVISIONING_STEP_STATUS.FAILED,
            error: MOCK_STEP_ERROR,
          },
        },
      }),
      reason: makeEnTranslator('tenantDetailsPanel')('fieldLockedReasonStep', {
        step: en.provisioningStatusView.stepLabel.MAP_DOMAIN,
      }),
    },
    {
      lock: 'while the main address is the custom domain',
      tenant: mockTenant({ primaryDomain: MOCK_CUSTOM_DOMAIN }),
      reason: en.tenantDetailsPanel.fieldLockedReasonCustomMainDomain,
    },
  ])('locks the domain field $lock', async ({ tenant, reason }) => {
    await setup({ tenant });

    const domainInput = screen.getByRole('textbox', {
      name: PRIMARY_DOMAIN_LABEL,
    });
    const nameInput = screen.getByRole('textbox', NAME_FIELD);

    expect(domainInput).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(domainInput).toHaveAccessibleDescription(reason);
    expect(nameInput).not.toBeDisabled();
  });

  it('locks every field once provisioning begins, before any step reports', async () => {
    await setup({
      tenant: mockTenant({
        provisioningStatus: TENANT_PROVISIONING_STATUS.PROVISIONING,
        provisioningSteps: mockIdleProvisioningSteps(),
      }),
    });

    const nameInput = screen.getByRole('textbox', NAME_FIELD);
    const domainInput = screen.getByRole('textbox', {
      name: PRIMARY_DOMAIN_LABEL,
    });

    expect(nameInput).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
    expect(domainInput).toHaveAttribute(ARIA_ATTRIBUTE.DISABLED, 'true');
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

    const runningBanner = screen.getByText(
      makeEnTranslator('provisioningBanner')('runningTitle', {
        step: 2,
        total: 6,
      }),
    );
    const nameInput = screen.getByRole('textbox', NAME_FIELD);

    expect(runningBanner).toBeVisible();
    expect(nameInput).toHaveAccessibleDescription(
      LOCKED_WHILE_PROVISIONING_IS_RUNNING,
    );

    await advancePoll();

    const doneBanner = screen.getByText(en.provisioningBanner.readyTitle);
    const lockedNameInput = screen.getByRole('textbox', NAME_FIELD);

    expect(doneBanner).toBeVisible();
    expect(lockedNameInput).toHaveAccessibleDescription(
      en.tenantDetailsPanel.fieldLockedReasonSucceeded,
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

    const domainStatus = screen.getByText(
      en.tenantOverviewPage.dnsStatus.VERIFIED,
    );
    const ownerJoinedAt = screen.getByText('Aug 12, 2026');
    const sanityProject = screen.getByText(MOCK_SANITY_PROJECT_ID);
    const activityActor = screen.getByText(MOCK_AUDIT_ACTOR_EMAIL);
    const finding = screen.getByText(
      en.findingKindLabel.PROVISIONING_STEP_FAILED,
    );

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
      name: en.tenantDetailsPanel.ownerEmailLabel,
    });
    const joinedLabel = screen.queryByText(en.tenantOverviewPage.joinedLabel);

    expect(ownerEmail).toBeVisible();
    expect(ownerEmailInput).toHaveValue(MOCK_INVITED_OWNER_EMAIL);
    expect(joinedLabel).not.toBeInTheDocument();
  });

  it('links Open site to the tenant live domain', async () => {
    await setup({ tenant: mockTenant() });

    const link = screen.getByRole('link', {
      name: OPEN_SITE_LINK_NAME,
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
        en.tenantOverviewPage.domainCardTitle,
        en.tenantOverviewPage.ownerCardTitle,
        en.tenantOverviewPage.contentWorkspaceCardTitle,
        en.tenantOverviewPage.recentActivityCardTitle,
        en.findingsCard.title,
      ].map((name) => screen.getByRole('heading', { level: 2, name }));
      const thirdLevelHeading = screen.queryByRole('heading', { level: 3 });

      for (const cardTitle of cardTitles) {
        expect(cardTitle).toBeVisible();
      }
      expect(thirdLevelHeading).not.toBeInTheDocument();
    });

    it('shows the Usage card straight after Grants', async () => {
      const headings = await screen.findAllByRole('heading', { level: 2 });
      const cardTitles = headings.map(({ textContent }) => textContent);

      expect(cardTitles.indexOf(en.usageCard.title)).toBe(
        cardTitles.indexOf(en.grantsCard.title) + 1,
      );
    });

    it('offers no Open Studio action', () => {
      const openStudioLink = screen.queryByRole('link', {
        name: en.getStartedCard.openStudio,
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

    it('shows no Usage card', () => {
      const usageTitle = screen.queryByRole('heading', {
        level: 2,
        name: en.usageCard.title,
      });

      expect(usageTitle).not.toBeInTheDocument();
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

    describe('on the platform tenant', () => {
      beforeEach(() => {
        resolveIsPlatformTenantMock.mockResolvedValue(true);
      });

      it('offers no Suspend, and says why', async () => {
        await setup({ tenant: mockTenant({ status: TENANT_STATUS.ACTIVE }) });

        const suspendButton = screen.queryByRole('button', {
          name: SUSPEND_TENANT,
        });
        const notice = screen.getByText(PLATFORM_TENANT_NOTICE_TEXT);

        expect(suspendButton).not.toBeInTheDocument();
        expect(notice).toBeVisible();
      });

      it('still offers Reactivate when suspended', async () => {
        await setup({
          tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }),
        });

        const reactivateButton = screen.getByRole('button', {
          name: REACTIVATE_TENANT_LABEL,
        });
        expect(reactivateButton).toBeVisible();
      });
    });

    describe.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
      'for a %s',
      (role) => {
        const viewer = mockOperatorViewer(role);

        it('never reads the tenant hosts', async () => {
          await setup({
            tenant: mockTenant({ status: TENANT_STATUS.ACTIVE }),
            viewer,
          });

          expect(resolveIsPlatformTenantMock).not.toHaveBeenCalled();
        });

        it('offers no Reactivate', async () => {
          await setup({
            tenant: mockTenant({ status: TENANT_STATUS.SUSPENDED }),
            viewer,
          });

          const reactivateButton = screen.queryByRole('button', {
            name: REACTIVATE_TENANT_LABEL,
          });
          expect(reactivateButton).not.toBeInTheDocument();
        });
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
