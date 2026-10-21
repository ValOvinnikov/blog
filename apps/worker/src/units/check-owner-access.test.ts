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
import { freezeClock, TEST_NOW } from '@worker/testing/clock/frozen-clock';
import {
  makeOwnerAccessTarget,
  makeSanityOwner,
  OWNER_EMAIL,
  OWNER_PROJECT_USER_ID,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { logger } from '@worker/utils/logger/logger';
import { postOperatorAlert } from '@worker/utils/operator-alert/operator-alert';
import {
  sendOwnerEmailOnce,
  sendPendingOwnerEmails,
} from '@worker/utils/owner-email/send-owner-email';
import { getProvisionEnv } from '@worker/utils/provision-env/provision-env';
import { FatalError, getStepMetadata } from 'workflow';

import { checkOwnerAccess } from './check-owner-access';

const FOUR_DAYS_AGO = new Date(TEST_NOW.getTime() - 4 * 24 * 60 * 60_000);
const SANITY_OUTAGE = '503';
const WAITING_TENANT = makeTenant({
  sanityProjectId: SANITY_PROJECT_ID,
  createdAt: TEST_NOW,
  ownerInviteSentAt: TEST_NOW,
});
const PENDING_INVITE = {
  id: 'invite-1',
  email: OWNER_EMAIL,
  status: 'pending',
  createdAt: '2026-10-20T09:00:00.000Z',
};

vi.mock('@worker/utils/logger/logger');
vi.mock('@worker/utils/operator-alert/operator-alert');
vi.mock('@worker/utils/owner-email/send-owner-email');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock(import('@blog/db/queries/tenants'), async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(await importOriginal()),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);
vi.mock(import('workflow'), async (importOriginal) => ({
  ...(await importOriginal()),
  getStepMetadata: vi.fn(),
}));

function onAttempt(attempt: number) {
  vi.mocked(getStepMetadata).mockReturnValue({
    attempt,
  } as ReturnType<typeof getStepMetadata>);
}

function aclEntry(roleName: string) {
  return {
    projectUserId: OWNER_PROJECT_USER_ID,
    roles: [{ name: roleName }],
    isRobot: false,
  };
}

describe(checkOwnerAccess, () => {
  beforeEach(() => {
    onAttempt(1);
    freezeClock();
    vi.mocked(getTenantById).mockResolvedValue(WAITING_TENANT);
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(OWNER_EMAIL);
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectAcl).mockResolvedValue([
      aclEntry(SANITY_PROJECT_ROLE.VIEWER),
    ]);
    vi.mocked(setTenantOwnerAccess).mockResolvedValue({
      ok: true,
      data: {} as never,
    });
    vi.mocked(updateProvisioningStep).mockResolvedValue({
      ok: true,
      data: makeTenant(),
    });
    vi.mocked(postOperatorAlert).mockResolvedValue(true);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the owner has accepted the invite', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectUsers).mockResolvedValue([
        makeSanityOwner({ email: 'Owner@Example.com' }),
      ]);
    });

    it('grants the owner administrator', async () => {
      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
      expect(grantSanityProjectRole).toHaveBeenCalledWith({
        token: getProvisionEnv().sanityManagementToken,
        projectId: SANITY_PROJECT_ID,
        projectUserId: OWNER_PROJECT_USER_ID,
        role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
    });

    it('records the acceptance, Sanity user, login provider and role', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(setTenantOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, {
        inviteAcceptedAt: TEST_NOW,
        sanityUserId: 'g-owner',
        loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
        sanityRole: STORED_SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
    });

    it('reports the outcome on the owner elevation step', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: TEST_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
      });
    });

    it('sends the owner the site-ready email', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(sendOwnerEmailOnce).toHaveBeenCalledWith(
        makeOwnerAccessTarget(WAITING_TENANT),
        TENANT_OWNER_EMAIL.SITE_READY,
      );
    });

    it('sends no invite reminders', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(sendPendingOwnerEmails).not.toHaveBeenCalled();
    });

    it('grants nothing when the owner is already administrator', async () => {
      vi.mocked(listSanityProjectAcl).mockResolvedValue([
        aclEntry(SANITY_PROJECT_ROLE.ADMINISTRATOR),
      ]);

      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ALREADY_ADMINISTRATOR);
      expect(grantSanityProjectRole).not.toHaveBeenCalled();
    });

    it('fails the attempt when recording the access fails', async () => {
      vi.mocked(setTenantOwnerAccess).mockResolvedValue({
        ok: false,
        error: ERROR_CODE.DB_NOT_FOUND,
      });

      await expect(checkOwnerAccess(TEST_TENANT_ID)).rejects.toThrow(
        /could not be recorded/,
      );
    });
  });

  it('adds an owner who is already an organization user straight to the project', async () => {
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([
      makeSanityOwner(),
    ]);

    const outcome = await checkOwnerAccess(TEST_TENANT_ID);

    expect(assignSanityProjectUserRole).toHaveBeenCalledWith({
      token: getProvisionEnv().sanityManagementToken,
      projectId: SANITY_PROJECT_ID,
      sanityUserId: 'g-owner',
      role: SANITY_PROJECT_ROLE.VIEWER,
    });
    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
  });

  it('reports pending acceptance while the invite is fresh', async () => {
    const outcome = await checkOwnerAccess(TEST_TENANT_ID);

    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(postOperatorAlert).not.toHaveBeenCalled();
  });

  it('sends whichever invite emails are due while the invite waits', async () => {
    await checkOwnerAccess(TEST_TENANT_ID);

    expect(sendPendingOwnerEmails).toHaveBeenCalledWith(
      makeOwnerAccessTarget(WAITING_TENANT),
    );
    expect(sendOwnerEmailOnce).not.toHaveBeenCalled();
  });

  it('sends no invite once one was recorded', async () => {
    await checkOwnerAccess(TEST_TENANT_ID);

    expect(listSanityProjectInvites).not.toHaveBeenCalled();
  });

  describe('when no invite was ever recorded', () => {
    beforeEach(() => {
      vi.mocked(getTenantById).mockResolvedValue(
        makeTenant({
          sanityProjectId: SANITY_PROJECT_ID,
          createdAt: TEST_NOW,
        }),
      );
      vi.mocked(listSanityProjectInvites)
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([PENDING_INVITE]);
    });

    it('sends the invite and records when it was sent', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(createSanityProjectInvite).toHaveBeenCalledWith({
        token: getProvisionEnv().sanityManagementToken,
        projectId: SANITY_PROJECT_ID,
        email: OWNER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
      expect(setTenantOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, {
        sanityInviteId: 'invite-1',
        inviteSentAt: new Date(PENDING_INVITE.createdAt),
        inviteAcceptedAt: null,
      });
    });

    it('measures the wait from the new invite, not from the tenant creation', async () => {
      vi.mocked(getTenantById).mockResolvedValue(
        makeTenant({
          sanityProjectId: SANITY_PROJECT_ID,
          createdAt: FOUR_DAYS_AGO,
        }),
      );
      vi.mocked(listSanityProjectInvites)
        .mockReset()
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([
          { ...PENDING_INVITE, createdAt: TEST_NOW.toISOString() },
        ]);

      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    });
  });

  describe('when Sanity keeps failing', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectUsers).mockRejectedValue(
        new Error(SANITY_OUTAGE),
      );
    });

    it('retries before its last attempt', async () => {
      await expect(checkOwnerAccess(TEST_TENANT_ID)).rejects.toThrow(
        SANITY_OUTAGE,
      );
    });

    it('logs and reports the wait as pending once the last attempt fails', async () => {
      onAttempt(99);

      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
      expect(logger.error).toHaveBeenCalledWith('owner_access.check_failed', {
        tenantId: TEST_TENANT_ID,
        error: SANITY_OUTAGE,
      });
      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: TEST_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE,
      });
    });

    it('still marks the owner stalled and alerts the operator after three days', async () => {
      onAttempt(99);
      vi.mocked(getTenantById).mockResolvedValue(
        makeTenant({
          sanityProjectId: SANITY_PROJECT_ID,
          ownerInviteSentAt: FOUR_DAYS_AGO,
        }),
      );

      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
      expect(postOperatorAlert).toHaveBeenCalledWith({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: TEST_TENANT_ID,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });

    it('logs and reports the wait as pending when the owner has no ACL entry yet', async () => {
      onAttempt(99);
      vi.mocked(listSanityProjectUsers).mockResolvedValue([makeSanityOwner()]);
      vi.mocked(listSanityProjectAcl).mockResolvedValue([]);

      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    });
  });

  describe('when the invite has gone unaccepted for three days', () => {
    beforeEach(() => {
      vi.mocked(getTenantById).mockResolvedValue(
        makeTenant({
          sanityProjectId: SANITY_PROJECT_ID,
          ownerInviteSentAt: FOUR_DAYS_AGO,
        }),
      );
    });

    it('marks the owner stalled and alerts the operator', async () => {
      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.STALLED);
      expect(postOperatorAlert).toHaveBeenCalledWith({
        kind: OPERATOR_ALERT_KIND.OWNER_ELEVATION,
        tenantId: TEST_TENANT_ID,
        outcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: TEST_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        notifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });

    it('does not alert again once the stall was notified', async () => {
      vi.mocked(getTenantById).mockResolvedValue(
        makeTenant({
          sanityProjectId: SANITY_PROJECT_ID,
          ownerInviteSentAt: FOUR_DAYS_AGO,
          lastNotifiedOwnerElevationOutcome:
            ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        }),
      );

      await checkOwnerAccess(TEST_TENANT_ID);

      expect(postOperatorAlert).not.toHaveBeenCalled();
    });

    it('does not record the stall as notified when the alert fails', async () => {
      vi.mocked(postOperatorAlert).mockResolvedValue(false);

      await checkOwnerAccess(TEST_TENANT_ID);

      expect(updateProvisioningStep).toHaveBeenCalledWith({
        tenantId: TEST_TENANT_ID,
        step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
        status: TENANT_PROVISIONING_STEP_STATUS.DONE,
        detail: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
      });
    });
  });

  it('fails fatally when the tenant has no Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());

    await expect(checkOwnerAccess(TEST_TENANT_ID)).rejects.toThrow(FatalError);
  });
});
