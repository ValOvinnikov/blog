import {
  ERROR_CODE,
  OPERATOR_ALERT_KIND,
  SANITY_LOGIN_PROVIDER,
  SANITY_PROJECT_ROLE,
} from '@blog/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  SANITY_PROJECT_ROLE as STORED_SANITY_PROJECT_ROLE,
  TENANT_PROVISIONING_STEP,
} from '@blog/db/constants';
import { getTenantOwnerEmail } from '@blog/db/queries/memberships';
import {
  getTenantById,
  setTenantOwnerAccess,
  updateProvisioningStep,
} from '@blog/db/queries/tenants';
import {
  grantSanityProjectRole,
  listSanityProjectAcl,
} from '@blog/db/utils/sanity-management-client/sanity-project-access';
import {
  assignSanityProjectUserRole,
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@blog/db/utils/sanity-management-client/sanity-project-users';
import {
  makeSanityOwner,
  OWNER_EMAIL,
  OWNER_PROJECT_USER_ID,
  SANITY_PROJECT_ID,
} from '@worker/testing/owner-access/fixtures';
import { makeTenant, TEST_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { postOperatorAlert } from '@worker/utils/operator-alert/operator-alert';
import { FatalError } from 'workflow';

import { checkOwnerAccess } from './check-owner-access';

const FOUR_DAYS_AGO = new Date(Date.now() - 4 * 24 * 60 * 60_000);

vi.mock('@worker/utils/logger/logger');
vi.mock('@worker/utils/operator-alert/operator-alert');
vi.mock('@blog/db/queries/memberships');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@blog/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@blog/db/queries/tenants', async (importOriginal) =>
  (
    await import('@worker/testing/tenants-queries/fake-tenants-queries')
  ).withFakeTenantsQueries(
    await importOriginal<typeof import('@blog/db/queries/tenants')>(),
  ),
);
vi.mock(
  '@worker/utils/provision-env/provision-env',
  () => import('@worker/testing/provision-env/fake-provision-env'),
);

function aclEntry(roleName: string) {
  return {
    projectUserId: OWNER_PROJECT_USER_ID,
    roles: [{ name: roleName }],
    isRobot: false,
  };
}

describe(checkOwnerAccess, () => {
  beforeEach(() => {
    vi.mocked(getTenantById).mockResolvedValue(
      makeTenant({ sanityProjectId: SANITY_PROJECT_ID, createdAt: new Date() }),
    );
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

  describe('when the owner has accepted the invite', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectUsers).mockResolvedValue([
        makeSanityOwner({ email: 'Owner@Example.com' }),
      ]);
    });

    it('grants the owner administrator', async () => {
      const outcome = await checkOwnerAccess(TEST_TENANT_ID);

      expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
      expect(grantSanityProjectRole).toHaveBeenCalledWith(
        expect.objectContaining({
          projectId: SANITY_PROJECT_ID,
          projectUserId: OWNER_PROJECT_USER_ID,
          role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
        }),
      );
    });

    it('records the acceptance, Sanity user, login provider and role', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(setTenantOwnerAccess).toHaveBeenCalledWith(TEST_TENANT_ID, {
        inviteAcceptedAt: expect.any(Date),
        sanityUserId: 'g-owner',
        loginProvider: SANITY_LOGIN_PROVIDER.GOOGLE,
        sanityRole: STORED_SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
    });

    it('reports the outcome on the owner elevation step', async () => {
      await checkOwnerAccess(TEST_TENANT_ID);

      expect(updateProvisioningStep).toHaveBeenCalledWith(
        expect.objectContaining({
          step: TENANT_PROVISIONING_STEP.OWNER_ELEVATION,
          detail: ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED,
        }),
      );
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

    expect(assignSanityProjectUserRole).toHaveBeenCalledWith(
      expect.objectContaining({
        sanityUserId: 'g-owner',
        role: SANITY_PROJECT_ROLE.VIEWER,
      }),
    );
    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.ELEVATED);
  });

  it('reports pending acceptance while the invite is fresh', async () => {
    const outcome = await checkOwnerAccess(TEST_TENANT_ID);

    expect(outcome).toBe(ELEVATE_TENANT_OWNER_OUTCOME.PENDING_ACCEPTANCE);
    expect(postOperatorAlert).not.toHaveBeenCalled();
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
      expect(updateProvisioningStep).toHaveBeenCalledWith(
        expect.objectContaining({
          notifiedOwnerElevationOutcome: ELEVATE_TENANT_OWNER_OUTCOME.STALLED,
        }),
      );
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

      expect(updateProvisioningStep).toHaveBeenCalledWith(
        expect.not.objectContaining({
          notifiedOwnerElevationOutcome: expect.anything(),
        }),
      );
    });
  });

  it('fails fatally when the tenant has no Sanity project', async () => {
    vi.mocked(getTenantById).mockResolvedValue(makeTenant());

    await expect(checkOwnerAccess(TEST_TENANT_ID)).rejects.toThrow(FatalError);
  });
});
