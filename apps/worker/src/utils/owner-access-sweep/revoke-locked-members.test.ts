import { ERROR_CODE } from '@shinefold/config/constants';
import {
  getMemberStudioAccess,
  listLockedMembersWithStudioAccess,
  setMemberStudioAccess,
} from '@shinefold/db/queries/memberships';
import { errorResult, okResult } from '@shinefold/utils';
import { MEMBER_ACCESS_LOG } from '@worker/constants/member-access';
import {
  MOCK_MEMBERSHIP_ID,
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_INVITE_ID,
  MOCK_MEMBER_SANITY_USER_ID,
  mockMemberTarget,
} from '@worker/testing/member-access/fixtures';
import { MOCK_SANITY_OUTAGE } from '@worker/testing/outage/fixtures';
import { MOCK_TENANT_ID } from '@worker/testing/tenant/fixtures';
import { revokeMemberAccess } from '@worker/units/revoke-member-access';
import { logger } from '@worker/utils/logger/logger';

import { revokeLockedMembers } from './revoke-locked-members';

const MOCK_OTHER_MEMBERSHIP_ID = 'membership-other';

const MOCK_LOCKED_MEMBER = {
  tenantId: MOCK_TENANT_ID,
  membershipId: MOCK_MEMBERSHIP_ID,
  email: MOCK_MEMBER_EMAIL,
  sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
  sanityInviteId: MOCK_MEMBER_INVITE_ID,
};

const MOCK_CLEARED_ACCESS = {
  sanityInviteId: null,
  inviteSentAt: null,
  inviteAcceptedAt: null,
  sanityUserId: null,
  loginProvider: null,
};

vi.mock('@shinefold/db/queries/memberships');
vi.mock('@worker/units/revoke-member-access');

describe(revokeLockedMembers, () => {
  beforeEach(() => {
    vi.mocked(listLockedMembersWithStudioAccess).mockResolvedValue([
      MOCK_LOCKED_MEMBER,
    ]);
    vi.mocked(getMemberStudioAccess).mockResolvedValue(undefined);
    vi.mocked(setMemberStudioAccess).mockResolvedValue(
      okResult(mockMemberTarget().access),
    );
  });

  it('revokes a locked member, then clears their recorded access', async () => {
    const result = await revokeLockedMembers();

    expect(revokeMemberAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      email: MOCK_MEMBER_EMAIL,
      sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
      sanityInviteId: MOCK_MEMBER_INVITE_ID,
    });
    expect(setMemberStudioAccess).toHaveBeenCalledWith(
      MOCK_TENANT_ID,
      MOCK_MEMBERSHIP_ID,
      MOCK_CLEARED_ACCESS,
    );
    expect(result).toEqual({ revoked: 1, failed: 0 });
  });

  it('leaves alone a member unlocked after the list was read', async () => {
    vi.mocked(getMemberStudioAccess).mockResolvedValue(mockMemberTarget());

    const result = await revokeLockedMembers();

    expect(revokeMemberAccess).not.toHaveBeenCalled();
    expect(setMemberStudioAccess).not.toHaveBeenCalled();
    expect(result).toEqual({ revoked: 0, failed: 0 });
  });

  it('revokes by Sanity user id when neither address nor invite is known', async () => {
    vi.mocked(listLockedMembersWithStudioAccess).mockResolvedValue([
      { ...MOCK_LOCKED_MEMBER, email: undefined, sanityInviteId: undefined },
    ]);

    const result = await revokeLockedMembers();

    expect(logger.warn).toHaveBeenCalledWith(
      MEMBER_ACCESS_LOG.LOCKED_INVITE_DELETE_SKIPPED,
      { tenantId: MOCK_TENANT_ID, membershipId: MOCK_MEMBERSHIP_ID },
    );
    expect(revokeMemberAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      email: undefined,
      sanityUserId: MOCK_MEMBER_SANITY_USER_ID,
      sanityInviteId: undefined,
    });
    expect(result).toEqual({ revoked: 1, failed: 0 });
  });

  it('hands over the recorded invite of a member with only an invite recorded', async () => {
    vi.mocked(listLockedMembersWithStudioAccess).mockResolvedValue([
      { ...MOCK_LOCKED_MEMBER, email: undefined, sanityUserId: undefined },
    ]);

    await revokeLockedMembers();

    expect(logger.warn).not.toHaveBeenCalled();
    expect(revokeMemberAccess).toHaveBeenCalledWith(MOCK_TENANT_ID, {
      email: undefined,
      sanityUserId: undefined,
      sanityInviteId: MOCK_MEMBER_INVITE_ID,
    });
  });

  it('logs a failed revoke, keeps the recorded access and carries on with the rest', async () => {
    vi.mocked(listLockedMembersWithStudioAccess).mockResolvedValue([
      MOCK_LOCKED_MEMBER,
      { ...MOCK_LOCKED_MEMBER, membershipId: MOCK_OTHER_MEMBERSHIP_ID },
    ]);
    vi.mocked(revokeMemberAccess).mockRejectedValueOnce(
      new Error(MOCK_SANITY_OUTAGE),
    );

    const result = await revokeLockedMembers();

    expect(logger.error).toHaveBeenCalledWith(MEMBER_ACCESS_LOG.REVOKE_FAILED, {
      tenantId: MOCK_TENANT_ID,
      membershipId: MOCK_MEMBERSHIP_ID,
      error: MOCK_SANITY_OUTAGE,
    });
    expect(vi.mocked(setMemberStudioAccess).mock.calls).toEqual([
      [MOCK_TENANT_ID, MOCK_OTHER_MEMBERSHIP_ID, MOCK_CLEARED_ACCESS],
    ]);
    expect(result).toEqual({ revoked: 1, failed: 1 });
  });

  it('counts a member removed before their access was cleared as revoked', async () => {
    vi.mocked(setMemberStudioAccess).mockResolvedValue(
      errorResult(ERROR_CODE.DB_NOT_FOUND),
    );

    await expect(revokeLockedMembers()).resolves.toEqual({
      revoked: 1,
      failed: 0,
    });
  });
});
