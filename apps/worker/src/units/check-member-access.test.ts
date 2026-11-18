import {
  ERROR_CODE,
  SANITY_LOGIN_PROVIDER,
  SANITY_PROJECT_ROLE,
} from '@shinefold/config/constants';
import {
  ELEVATE_TENANT_OWNER_OUTCOME,
  MEMBERSHIP_ROLE,
  OWNER_ACCESS_STALL_AFTER_MS,
} from '@shinefold/db/constants';
import {
  getMemberStudioAccess,
  getTenantOwnerEmail,
  setMemberStudioAccess,
} from '@shinefold/db/queries/memberships';
import { getTenantById } from '@shinefold/db/queries/tenants';
import {
  createSanityProjectInvite,
  deleteSanityProjectInvite,
  grantSanityProjectRole,
  listSanityProjectAcl,
  listSanityProjectInvites,
  revokeSanityProjectRole,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-access';
import {
  listSanityOrganizationUsers,
  listSanityProjectUsers,
} from '@shinefold/db/utils/sanity-management-client/sanity-project-users';
import { errorResult, okResult } from '@shinefold/utils/result';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import { freezeClock, MOCK_NOW } from '@worker/testing/clock/frozen-clock';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_INVITE_ID,
  MOCK_MEMBER_PROJECT_USER_ID,
  MOCK_MEMBER_SANITY_USER_ID,
  MOCK_MEMBER_VIEWER_ACL,
  MOCK_MEMBERSHIP_ID,
  mockMemberAclEntry,
  mockMemberTarget,
  mockSanityMember,
} from '@worker/testing/member-access/fixtures';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import {
  MOCK_OWNER_EMAIL,
  mockPendingInvite,
} from '@worker/testing/owner-access/fixtures';
import { MOCK_PROVISION_ENV } from '@worker/testing/provision-env/fake-provision-env';
import {
  MOCK_SANITY_PROJECT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_PROJECT_CALL,
  mockProvisionedTenant,
  mockTenant,
} from '@worker/testing/tenant/fixtures';
import { atStepAttempt } from '@worker/testing/workflow/step-attempt';
import { logger } from '@worker/utils/logger/logger';

import { checkMemberAccess } from './check-member-access';

const { ELEVATED, ALREADY_ADMINISTRATOR, PENDING_ACCEPTANCE, STALLED } =
  ELEVATE_TENANT_OWNER_OUTCOME;
const MOCK_STALLED_SENT_AT = new Date(
  MOCK_NOW.getTime() - OWNER_ACCESS_STALL_AFTER_MS,
);
const MOCK_MEMBER_INVITE = mockPendingInvite({
  id: MOCK_MEMBER_INVITE_ID,
  email: MOCK_MEMBER_EMAIL,
  createdAt: MOCK_NOW.toISOString(),
});

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@shinefold/db/queries/tenants');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-access');
vi.mock('@shinefold/db/utils/sanity-management-client/sanity-project-users');
vi.mock('@worker/utils/provision-env/provision-env');
vi.mock('@worker/utils/tenant-management-token/tenant-management-token');
vi.mock('workflow');

function check() {
  return checkMemberAccess(MOCK_TENANT_ID, MOCK_MEMBERSHIP_ID);
}

describe(checkMemberAccess, () => {
  beforeEach(() => {
    atStepAttempt(1);
    freezeClock();
    vi.mocked(getTenantById).mockResolvedValue(mockProvisionedTenant());
    vi.mocked(getTenantOwnerEmail).mockResolvedValue(MOCK_OWNER_EMAIL);
    vi.mocked(getMemberStudioAccess).mockResolvedValue(mockMemberTarget());
    vi.mocked(setMemberStudioAccess).mockResolvedValue(okResult({} as never));
    vi.mocked(listSanityProjectUsers).mockResolvedValue([]);
    vi.mocked(listSanityOrganizationUsers).mockResolvedValue([]);
    vi.mocked(listSanityProjectInvites).mockResolvedValue([]);
    vi.mocked(listSanityProjectAcl).mockResolvedValue(MOCK_MEMBER_VIEWER_ACL);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('when the member has not been invited yet', () => {
    beforeEach(() => {
      vi.mocked(listSanityProjectInvites)
        .mockResolvedValueOnce([])
        .mockResolvedValue([MOCK_MEMBER_INVITE]);
    });

    it('invites them to the project as viewer', async () => {
      await check();

      expect(createSanityProjectInvite).toHaveBeenCalledWith({
        ...MOCK_TENANT_PROJECT_CALL,
        email: MOCK_MEMBER_EMAIL,
        role: SANITY_PROJECT_ROLE.VIEWER,
      });
    });

    it('records the invite as sent and waits for acceptance', async () => {
      const result = await check();

      expect(setMemberStudioAccess).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        {
          sanityInviteId: MOCK_MEMBER_INVITE_ID,
          inviteSentAt: MOCK_NOW,
          inviteAcceptedAt: null,
        },
      );
      expect(result).toEqual({ outcome: PENDING_ACCEPTANCE, hasFailed: false });
    });

    it('withdraws the invite again when the member was removed meanwhile', async () => {
      vi.mocked(setMemberStudioAccess).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );

      const result = await check();

      expect(deleteSanityProjectInvite).toHaveBeenCalledWith({
        ...MOCK_TENANT_PROJECT_CALL,
        inviteId: MOCK_MEMBER_INVITE_ID,
      });
      expect(result).toEqual({ outcome: null, hasFailed: false });
    });
  });

  describe('when the invite is out and not yet accepted', () => {
    it('waits without sending another', async () => {
      vi.mocked(getMemberStudioAccess).mockResolvedValue(
        mockMemberTarget({ inviteSentAt: MOCK_NOW }),
      );

      const result = await check();

      expect(createSanityProjectInvite).not.toHaveBeenCalled();
      expect(setMemberStudioAccess).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: PENDING_ACCEPTANCE, hasFailed: false });
    });

    it('reports the member stalled once the invite is three days old', async () => {
      vi.mocked(getMemberStudioAccess).mockResolvedValue(
        mockMemberTarget({ inviteSentAt: MOCK_STALLED_SENT_AT }),
      );

      const { outcome } = await check();

      expect(outcome).toBe(STALLED);
    });
  });

  describe('when the member has accepted the invite', () => {
    beforeEach(() => {
      vi.mocked(getMemberStudioAccess).mockResolvedValue(
        mockMemberTarget({
          sanityInviteId: MOCK_MEMBER_INVITE_ID,
          inviteSentAt: MOCK_STALLED_SENT_AT,
        }),
      );
      vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityMember()]);
    });

    it('raises them to administrator in place of viewer', async () => {
      await check();

      expect(grantSanityProjectRole).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
        role: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
      expect(revokeSanityProjectRole).toHaveBeenCalledWith({
        ...MOCK_TENANT_PROJECT_CALL,
        projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
        roleName: SANITY_PROJECT_ROLE.VIEWER,
      });
    });

    it('records the member as ready', async () => {
      const result = await check();

      expect(setMemberStudioAccess).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        {
          sanityInviteId: null,
          inviteSentAt: MOCK_STALLED_SENT_AT,
          inviteAcceptedAt: MOCK_NOW,
          sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
          loginProvider: SANITY_LOGIN_PROVIDER.GITHUB,
        },
      );
      expect(result).toEqual({ outcome: ELEVATED, hasFailed: false });
    });

    it('deletes any invite still pending for them', async () => {
      vi.mocked(listSanityProjectInvites).mockResolvedValue([
        MOCK_MEMBER_INVITE,
      ]);

      await check();

      expect(deleteSanityProjectInvite).toHaveBeenCalledWith({
        ...MOCK_TENANT_PROJECT_CALL,
        inviteId: MOCK_MEMBER_INVITE_ID,
      });
    });

    it('revokes the role it just granted when the member was removed meanwhile', async () => {
      vi.mocked(setMemberStudioAccess).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );
      vi.mocked(listSanityProjectAcl)
        .mockResolvedValueOnce(MOCK_MEMBER_VIEWER_ACL)
        .mockResolvedValue([
          mockMemberAclEntry(SANITY_PROJECT_ROLE.ADMINISTRATOR),
        ]);

      const result = await check();

      expect(revokeSanityProjectRole).toHaveBeenLastCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
        roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
      expect(result).toEqual({ outcome: null, hasFailed: false });
    });
  });

  describe('when the member is already ready', () => {
    beforeEach(() => {
      vi.mocked(getMemberStudioAccess).mockResolvedValue(
        mockMemberTarget({
          inviteSentAt: MOCK_STALLED_SENT_AT,
          inviteAcceptedAt: MOCK_STALLED_SENT_AT,
          sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
        }),
      );
      vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityMember()]);
      vi.mocked(listSanityProjectAcl).mockResolvedValue([
        mockMemberAclEntry(SANITY_PROJECT_ROLE.ADMINISTRATOR),
      ]);
    });

    it('changes nothing in Sanity or the record', async () => {
      const result = await check();

      expect(grantSanityProjectRole).not.toHaveBeenCalled();
      expect(revokeSanityProjectRole).not.toHaveBeenCalled();
      expect(setMemberStudioAccess).toHaveBeenCalledWith(
        MOCK_TENANT_ID,
        MOCK_MEMBERSHIP_ID,
        {},
      );
      expect(result).toEqual({
        outcome: ALREADY_ADMINISTRATOR,
        hasFailed: false,
      });
    });

    it('revokes administrator when the member was removed since it was read', async () => {
      vi.mocked(setMemberStudioAccess).mockResolvedValue(
        errorResult(ERROR_CODE.DB_NOT_FOUND),
      );

      const result = await check();

      expect(revokeSanityProjectRole).toHaveBeenCalledWith({
        token: MOCK_PROVISION_ENV.sanityManagementToken,
        projectId: MOCK_SANITY_PROJECT_ID,
        projectUserId: MOCK_MEMBER_PROJECT_USER_ID,
        roleName: SANITY_PROJECT_ROLE.ADMINISTRATOR,
      });
      expect(result).toEqual({ outcome: null, hasFailed: false });
    });
  });

  describe.each([
    ['has been removed or locked', undefined],
    ['is a reader', mockMemberTarget({}, { role: MEMBERSHIP_ROLE.READER })],
    ['is an owner', mockMemberTarget({}, { role: MEMBERSHIP_ROLE.OWNER })],
    [
      'shares the owner address',
      mockMemberTarget({}, { email: MOCK_OWNER_EMAIL }),
    ],
  ])('when the membership %s', (_, member) => {
    beforeEach(() => {
      vi.mocked(getMemberStudioAccess).mockResolvedValue(member);
      vi.mocked(listSanityProjectUsers).mockResolvedValue([mockSanityMember()]);
    });

    it('ends without touching Sanity', async () => {
      const result = await check();

      expect(createSanityProjectInvite).not.toHaveBeenCalled();
      expect(grantSanityProjectRole).not.toHaveBeenCalled();
      expect(result).toEqual({ outcome: null, hasFailed: false });
    });
  });

  it('throws so the step retries while attempts remain', async () => {
    vi.mocked(listSanityProjectUsers).mockRejectedValue(
      new Error(MOCK_SANITY_OUTAGE),
    );

    await expect(check()).rejects.toThrow(MOCK_SANITY_OUTAGE);
  });

  describe('on its last attempt', () => {
    beforeEach(() => {
      atStepAttempt(99);
    });

    it('ends failed when the tenant has no Sanity project', async () => {
      vi.mocked(getTenantById).mockResolvedValue(mockTenant());

      await expect(check()).resolves.toEqual({
        outcome: null,
        hasFailed: true,
      });
    });

    it('logs the failure and ends failed', async () => {
      vi.mocked(listSanityProjectUsers).mockRejectedValue(
        new Error(MOCK_SANITY_OUTAGE),
      );

      const result = await check();

      expect(logger.error).toHaveBeenCalledWith(
        MEMBER_ACCESS_LOG.CHECK_FAILED,
        {
          tenantId: MOCK_TENANT_ID,
          membershipId: MOCK_MEMBERSHIP_ID,
          error: MOCK_SANITY_OUTAGE,
        },
      );
      expect(result).toEqual({ outcome: null, hasFailed: true });
    });
  });
});
