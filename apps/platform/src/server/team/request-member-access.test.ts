import { MEMBER_ACCESS_PATH } from '@platform/constants/team-access';
import { requireTenantOwnerOrAdmin } from '@platform/server/auth/require-tenant-owner-or-admin';
import { enqueueOwnerAccessRequest } from '@platform/server/owner-access/request-owner-access';
import {
  MOCK_MEMBER_EMAIL,
  MOCK_MEMBER_ID,
} from '@platform/testing/team/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';
import { ACTION_OUTCOME, NEXT_NAVIGATION_ERROR } from '@shinefold/config';
import { queries } from '@shinefold/db';
import { MEMBERSHIP_ROLE } from '@shinefold/db/constants';
import type { TMemberStudioAccessTarget } from '@shinefold/db/queries/memberships';

import { checkMemberAccessAction } from './check-member-access-action';
import { resendMemberInviteAction } from './resend-member-invite-action';

vi.mock('@platform/server/auth/require-tenant-owner-or-admin');

vi.mock('@platform/server/owner-access/request-owner-access', () => ({
  enqueueOwnerAccessRequest: vi.fn(),
}));

vi.mock('@shinefold/db', async () =>
  (await import('@platform/testing/team/fixtures')).mockTeamDb(),
);

const getAccess = vi.mocked(queries.memberships.getMemberStudioAccess);
const enqueue = vi.mocked(enqueueOwnerAccessRequest);

const accessTarget = (
  role: TMemberStudioAccessTarget['role'],
): TMemberStudioAccessTarget => ({
  membershipId: MOCK_MEMBER_ID,
  role,
  email: MOCK_MEMBER_EMAIL,
  access: {
    sanityInviteId: undefined,
    inviteSentAt: undefined,
    inviteAcceptedAt: undefined,
    sanityUserId: undefined,
    loginProvider: undefined,
  },
});

const ACTIONS = [
  [
    checkMemberAccessAction.name,
    checkMemberAccessAction,
    MEMBER_ACCESS_PATH.CHECK,
  ],
  [
    resendMemberInviteAction.name,
    resendMemberInviteAction,
    MEMBER_ACCESS_PATH.RESEND,
  ],
] as const;

describe.each(ACTIONS)('%s', (_name, action, path) => {
  beforeEach(() => {
    vi.mocked(requireTenantOwnerOrAdmin).mockReset();
    getAccess
      .mockReset()
      .mockResolvedValue(accessTarget(MEMBERSHIP_ROLE.EDITOR));
    enqueue.mockReset().mockResolvedValue({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it("asks the worker about an unlocked editor's Studio access", async () => {
    const result = await action(MOCK_TENANT_ID, MOCK_MEMBER_ID);

    expect(enqueue).toHaveBeenCalledExactlyOnceWith(path, MOCK_TENANT_ID, {
      membershipId: MOCK_MEMBER_ID,
    });
    expect(result).toEqual({ outcome: ACTION_OUTCOME.SUCCESS });
  });

  it('lets only the owner and a super-admin through', async () => {
    vi.mocked(requireTenantOwnerOrAdmin).mockRejectedValue(
      new Error(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND),
    );

    await expect(action(MOCK_TENANT_ID, MOCK_MEMBER_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(enqueue).not.toHaveBeenCalled();
  });

  it.each([
    ['a reader', accessTarget(MEMBERSHIP_ROLE.READER)],
    ['a locked or missing member', undefined],
  ])('refuses %s', async (_case, target) => {
    getAccess.mockResolvedValue(target);

    await expect(action(MOCK_TENANT_ID, MOCK_MEMBER_ID)).rejects.toThrow(
      NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
    );
    expect(enqueue).not.toHaveBeenCalled();
  });
});
