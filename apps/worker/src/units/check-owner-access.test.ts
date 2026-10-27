import {
  ERROR_CODE,
  OPERATOR_ALERT_KIND,
  SANITY_LOGIN_PROVIDER,
  SANITY_PROJECT_ROLE,
} from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  SANITY_PROJECT_ROLE as STORED_SANITY_PROJECT_ROLE,
  TENANT_OWNER_EMAIL,
  TENANT_PROVISIONING_STEP,
  TENANT_PROVISIONING_STEP_STATUS,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import {
  getTenantById,
  setTenantOwnerAccess,
  touchTenantActivity,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import {
  createSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  assignSanityProjectUserRole,
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import { errorResult, okResult } from '@blog/utils/result';
import { OWNER_ACCESS_ACTIVITY_TOUCH_FAILED_EVENT } from '@worker/constants/owner-access';
import { freezeClock, MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_INVITE_SENT_AT,
  MOCK_MIXED_CASE_OWNER_EMAIL,
  MOCK_OWNER_EMAIL,
  MOCK_OWNER_PROJECT_USER_ID,
  MOCK_SANITY_INVITE_ID,
  MOCK_SANITY_USER_ID,
  mockOwnerAccessTarget,
  mockPendingInvite,
  mockSanityOwner,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';
import { postOperatorAlert } from '@worker/utils/operator-alert/operator-alert';
import {
  sendOwnerEmailOnce,
  sendPendingOwnerEmails,
} from '@worker/utils/owner-email/send-owner-email';
import { FatalError } from 'workflow';

import { checkOwnerAccess } from './check-owner-access';

const FOUR_DAYS_AGO = new Date(MOCK_NOW.getTime() - 4 * 24 * 60 * 60_000);
const WAITING_TENANT = mockProvisionedTenant({
  createdAt: MOCK_NOW,
  ownerInviteSentAt: MOCK_NOW,
});

vi.mock('@worker/utils/operator-alert/operator-alert');
vi.mock('@worker/utils/owner-email/send-owner-email');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@blog/db/queries/tenants');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('workflow');

function aclEntry(roleName: string) {
  return {
    projectUserId: MOCK_OWNER_PROJECT_USER_ID,
    roles: [{ name: roleName }],
    isRobot: false,
  };
}

describe(checkOwnerAccess, () => {
  beforeEach(() => {
    atStepAttempt(1);
    freezeClock();
    vi.mocked(getTenantById).mockResolvedValue(WAITING_TENANT);
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectAcl).mockResolvedValue([
      aclEntry(SANITY_PROJECT_ROLE.VIEWER),
    ]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue(okResult({} as never));
    vi.mocked(updateProvisioningStep).mockResolvedValue(okResult(mockTenant()));
    vi.mocked(touchTenantActivity).mockResolvedValue(okResult(mockTenant()));
    vi.mocked(postOperatorAlert).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the owner has accepted the invite', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectUsers).mockResolvedValue([
        mockSanityOwner({ email: MOCK_MIXED_CASE_OWNER_EMAIL }),
      ]);
    });

    it('grants the owner administrator', async () => {
      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
      expect(grantSanityProjectRole).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        projectUserId: MOCK_OWNER_PROJECT_USER_ID,
        role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
    });

    it('records the acceptance, Sanity user, login provider and role', async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(setTenantOwnerAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        inviteAcceptedAt: MOCK_NOW,
        sanityUserId: MOCK_SANITY_USER_ID,
        loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
        sanityRole: STORED_SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
    });

    it('reports the outcome on the owner elevation step', async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
      });
    });

    it('sends the owner the site-ready email', async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(sendOwnerEmailOnce).toHaveBeenCalledWith(
        mockOwnerAccessTarget(WAITING_TENANT),
        TENANT_OWNER_EMAIL.SITE_READY,
      );
    });

    it('sends no invite reminders', async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(sendPendingOwnerEmails).not.toHaveBeenCalled();
    });

    it('grants nothing when the owner is already administrator', async () => {
      vi.mocked(listSanityProjectAcl).mockResolvedValue([
        aclEntry(SANITY_PROJECT_ROLE.ADMINISTRATOR),
      ]);

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR);
      expect(grantSanityProjectRole).not.toHaveBeenCalled();
    });

    it("resets the tenant's inactivity clock to the acceptance", async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(touchTenantActivity).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_NOW,
      );
    });

    it('leaves the inactivity clock alone once the acceptance was recorded', async () => {
      vi.mocked(getTenantById).mockResolvedValue({
        ...WAITING_TENANT,
        ownerInviteAcceptedAt: FOUR_DAYS_AGO,
      });

      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(touchTenantActivity).not.toHaveBeenCalled();
    });

    it('still grants access and logs when the inactivity clock cannot be reset', async () => {
      vi.mocked(touchTenantActivity).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
      expect(logger.error).toHaveBeenCalledWith(
        OWNER_ACCESS_ACTIVITY_TOUCH_FAILED_EVENT,
        { tenantId: MOCK_TENANT_ID, error: ERROR_CODE.DB_NOT_FOUND },
      );
    });

    it('fails the attempt when recording the access fails', async () => {
      vi.mocked(setTenantOwnerAccess).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );

      await expect(checkOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(
        /could not be recorded/,
      );
    });
  });

  it('adds an owner who is already an organization user straight to the project', async () => {
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([
      mockSanityOwner(),
    ]);

    const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

    expect(assignSanityProjectUserRole).toHaveBeenCalledWith({
      token: MOCK_PROVISION_ENV.sanityManagementToken,
      projectId: MOCK_SANITY_PROJECT_ID,
      sanityUserId: MOCK_SANITY_USER_ID,
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
  });

  it('reports pending acceptance while the invite is fresh', async () => {
    const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(postOperatorAlert).not.toHaveBeenCalled();
  });

  it('sends whichever invite emails are due while the invite waits', async () => {
    await checkOwnerAccess(MOCK_TENANT_ID);

    expect(sendPendingOwnerEmails).toHaveBeenCalledWith(
      mockOwnerAccessTarget(WAITING_TENANT),
    );
    expect(sendOwnerEmailOnce).not.toHaveBeenCalled();
  });

  it('sends no invite once one was recorded', async () => {
    await checkOwnerAccess(MOCK_TENANT_ID);

    expect(listSanityProjectInvites).not.toHaveBeenCalled();
  });

  describe('when no invite was ever recorded', () => {
    beforeEach(() => {
      vi.mocked(getTenantById).mockResolvedValue(
        mockProvisionedTenant({
          createdAt: MOCK_NOW,
        }),
      );
      vi.mocked(listSanityProjectInvites)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([mockPendingInvite()]);
    });

    it('sends the invite and records when it was sent', async () => {
      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(createSanityProjectInvite).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        email: MOCK_OWNER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
      expect(setTenantOwnerAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
        sanityInviteId: MOCK_SANITY_INVITE_ID,
        inviteSentAt: new Date(MOCK_INVITE_SENT_AT),
        inviteAcceptedAt: null,
      });
    });

    it('measures the wait from the new invite, not from the tenant creation', async () => {
      vi.mocked(getTenantById).mockResolvedValue(
        mockProvisionedTenant({
          createdAt: FOUR_DAYS_AGO,
        }),
      );
      vi.mocked(listSanityProjectInvites)
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { ...mockPendingInvite(), createdAt: MOCK_NOW.toISOString() },
        ]);

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    });
  });

  describe('when Sanity keeps failing', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectUsers).mockRejectedValue(
        new Error(MOCK_SANITY_OUTAGE),
      );
    });

    it('retries before its last attempt', async () => {
      await expect(checkOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(
        MOCK_SANITY_OUTAGE,
      );
    });

    it('logs and reports the wait as pending once the last attempt fails', async () => {
      atStepAttempt(99);

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
      expect(logger.error).toHaveBeenCalledWith('owner_access.check_failed', {
        tenantId: MOCK_TENANT_ID,
        error: MOCK_SANITY_OUTAGE,
      });
      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
      });
    });

    it('still marks the owner stalled and alerts the operator after three days', async () => {
      atStepAttempt(99);
      vi.mocked(getTenantById).mockResolvedValue(
        mockProvisionedTenant({
          ownerInviteSentAt: FOUR_DAYS_AGO,
        }),
      );

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
      expect(postOperatorAlert).toHaveBeenCalledWith({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: MOCK_TENANT_ID,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });

    it('logs and reports the wait as pending when the owner has no ACL entry yet', async () => {
      atStepAttempt(99);
      vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityOwner()]);
      vi.mocked(listSanityProjectAcl).mockResolvedValue([]);

      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    });
  });

  describe('when the invite has gone unaccepted for three days', () => {
    beforeEach(() => {
      vi.mocked(getTenantById).mockResolvedValue(
        mockProvisionedTenant({
          ownerInviteSentAt: FOUR_DAYS_AGO,
        }),
      );
    });

    it('marks the owner stalled and alerts the operator', async () => {
      const outcome = await checkOwnerAccess(MOCK_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
      expect(postOperatorAlert).toHaveBeenCalledWith({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: MOCK_TENANT_ID,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        notifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });

    it('does not alert again once the stall was notified', async () => {
      vi.mocked(getTenantById).mockResolvedValue(
        mockProvisionedTenant({
          ownerInviteSentAt: FOUR_DAYS_AGO,
          lastNotifiedOwnerElevationOutcome:
            ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        }),
      );

      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(postOperatorAlert).not.toHaveBeenCalled();
    });

    it('does not record the stall as notified when the alert fails', async () => {
      vi.mocked(postOperatorAlert).mockResolvedValue(false);

      await checkOwnerAccess(MOCK_TENANT_ID);

      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: MOCK_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });
  });

  it('fails fatally when the tenant has no Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(mockTenant());

    await expect(checkOwnerAccess(MOCK_TENANT_ID)).rejects.toThrow(FatalError);
  });
});
