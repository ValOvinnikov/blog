import {
  MOCK_DB_ERROR_MESSAGE,
  MOCK_INVITE_ID,
  MOCK_OTHER_INVITE_ID,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
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

describe(consumePendingInvitesOnSignIn, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset();
    consumeMembershipInviteMock.mockReset();
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
      { id: MOCK_OTHER_INVITE_ID, tenantId: MOCK_OTHER_TENANT_ID },
    ]);
  });

  it("consumes every pending invite for the signed-in user's email", async () => {
    await consumePendingInvitesOnSignIn({
      user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
    });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(MOCK_EMAIL);
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      MOCK_INVITE_ID,
      MOCK_USER_ID,
    );
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      MOCK_OTHER_INVITE_ID,
      MOCK_USER_ID,
    );
  });

  it('consumes every matched invite even when an earlier one was already consumed', async () => {
    consumeMembershipInviteMock.mockImplementation((inviteId: string) =>
      Promise.resolve(
        inviteId === MOCK_INVITE_ID
          ? undefined
          : { id: MOCK_OTHER_INVITE_ID, tenantId: MOCK_OTHER_TENANT_ID },
      ),
    );

    await consumePendingInvitesOnSignIn({
      user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
    });

    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      MOCK_INVITE_ID,
      MOCK_USER_ID,
    );
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      MOCK_OTHER_INVITE_ID,
      MOCK_USER_ID,
    );
  });

  it('is a no-op when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    await consumePendingInvitesOnSignIn({
      user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
    });

    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('is a no-op without looking up invites when the user has no resolved id', async () => {
    await consumePendingInvitesOnSignIn({
      user: { email: MOCK_EMAIL },
    });

    expect(findPendingInviteByEmailMock).not.toHaveBeenCalled();
    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('is a no-op without looking up invites when the user has no email', async () => {
    await consumePendingInvitesOnSignIn({ user: { id: MOCK_USER_ID } });

    expect(findPendingInviteByEmailMock).not.toHaveBeenCalled();
    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('resolves without rethrowing when findPendingInviteByEmail throws', async () => {
    findPendingInviteByEmailMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    await expect(
      consumePendingInvitesOnSignIn({
        user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without rethrowing when consumeMembershipInvite throws', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
    ]);
    consumeMembershipInviteMock.mockRejectedValue(
      new Error(MOCK_DB_ERROR_MESSAGE),
    );

    await expect(
      consumePendingInvitesOnSignIn({
        user: { id: MOCK_USER_ID, email: MOCK_EMAIL },
      }),
    ).resolves.toBeUndefined();
  });
});
