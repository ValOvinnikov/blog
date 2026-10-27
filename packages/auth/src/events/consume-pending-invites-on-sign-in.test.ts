import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_INVITE_ID,
  MOCK_OTHER_INVITE_ID,
  MOCK_OTHER_TENANT_ID,
  mockPendingInvite,
} from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_EMAIL, MOCK_USER_ID } from '@blog/auth/testing/session-fixtures';

import { consumePendingInvitesOnSignIn } from './consume-pending-invites-on-sign-in';

const { findPendingInviteByEmailMock, consumeMembershipInviteMock } =
  vi.hoisted(() => ({
    findPendingInviteByEmailMock: vi.fn(),
    consumeMembershipInviteMock: vi.fn(),
  }));

vi.mock('@blog/db', () => ({
  queries: {
    membershipInvites: {
      findPendingInviteByEmail: findPendingInviteByEmailMock,
      consumeMembershipInvite: consumeMembershipInviteMock,
    },
  },
}));

const MOCK_USER = { id: MOCK_USER_ID, email: MOCK_EMAIL };

describe(consumePendingInvitesOnSignIn, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockResolvedValue([
      mockPendingInvite(),
      mockPendingInvite({
        id: MOCK_OTHER_INVITE_ID,
        tenantId: MOCK_OTHER_TENANT_ID,
      }),
    ]);
  });

  it("consumes every pending invite for the signed-in user's email", async () => {
    await consumePendingInvitesOnSignIn({ user: MOCK_USER });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(MOCK_EMAIL);
    expect(consumeMembershipInviteMock.mock.calls).toEqual([
      [MOCK_INVITE_ID, MOCK_USER_ID],
      [MOCK_OTHER_INVITE_ID, MOCK_USER_ID],
    ]);
  });

  it('consumes every invite even when an earlier one was already consumed', async () => {
    consumeMembershipInviteMock.mockResolvedValueOnce(undefined);

    await consumePendingInvitesOnSignIn({ user: MOCK_USER });

    expect(consumeMembershipInviteMock.mock.calls).toEqual([
      [MOCK_INVITE_ID, MOCK_USER_ID],
      [MOCK_OTHER_INVITE_ID, MOCK_USER_ID],
    ]);
  });

  it('is a no-op when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    await consumePendingInvitesOnSignIn({ user: MOCK_USER });

    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it.each([
    ['resolved id', { email: MOCK_EMAIL }],
    ['email', { id: MOCK_USER_ID }],
  ])('looks up no invites when the user has no %s', async (_, user) => {
    await consumePendingInvitesOnSignIn({ user });

    expect(findPendingInviteByEmailMock).not.toHaveBeenCalled();
    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it.each([
    ['finding invites', findPendingInviteByEmailMock],
    ['consuming an invite', consumeMembershipInviteMock],
  ])('resolves without rethrowing when %s throws', async (_, failingMock) => {
    failingMock.mockRejectedValue(new Error(MOCK_DB_ERROR_MESSAGE));

    await expect(
      consumePendingInvitesOnSignIn({ user: MOCK_USER }),
    ).resolves.toBeUndefined();
  });
});
