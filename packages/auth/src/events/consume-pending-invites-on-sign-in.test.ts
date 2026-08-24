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
  });

  it("consumes every pending invite for the signed-in user's email", async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
      { id: 'invite-2', tenantId: 'tenant-2' },
    ]);

    await consumePendingInvitesOnSignIn({
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    expect(findPendingInviteByEmailMock).toHaveBeenCalledWith(
      'owner@example.com',
    );
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      'invite-1',
      'user-1',
    );
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      'invite-2',
      'user-1',
    );
  });

  it('consumes every matched invite even when an earlier one was already consumed', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
      { id: 'invite-2', tenantId: 'tenant-2' },
    ]);
    // Simulates a race where invite-1 was already consumed elsewhere:
    // `consumeMembershipInvite` resolves to `undefined` for it.
    consumeMembershipInviteMock.mockImplementation((inviteId: string) =>
      Promise.resolve(
        inviteId === 'invite-1'
          ? undefined
          : { id: 'invite-2', tenantId: 'tenant-2' },
      ),
    );

    await consumePendingInvitesOnSignIn({
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      'invite-1',
      'user-1',
    );
    expect(consumeMembershipInviteMock).toHaveBeenCalledWith(
      'invite-2',
      'user-1',
    );
  });

  it('is a no-op when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    await consumePendingInvitesOnSignIn({
      user: { id: 'user-1', email: 'owner@example.com' },
    });

    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('is a no-op without looking up invites when the user has no resolved id', async () => {
    await consumePendingInvitesOnSignIn({
      user: { email: 'owner@example.com' },
    });

    expect(findPendingInviteByEmailMock).not.toHaveBeenCalled();
    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('is a no-op without looking up invites when the user has no email', async () => {
    await consumePendingInvitesOnSignIn({ user: { id: 'user-1' } });

    expect(findPendingInviteByEmailMock).not.toHaveBeenCalled();
    expect(consumeMembershipInviteMock).not.toHaveBeenCalled();
  });

  it('resolves without rethrowing when findPendingInviteByEmail throws', async () => {
    findPendingInviteByEmailMock.mockRejectedValue(new Error('db error'));

    await expect(
      consumePendingInvitesOnSignIn({
        user: { id: 'user-1', email: 'owner@example.com' },
      }),
    ).resolves.toBeUndefined();
  });

  it('resolves without rethrowing when consumeMembershipInvite throws', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
    ]);
    consumeMembershipInviteMock.mockRejectedValue(new Error('db error'));

    await expect(
      consumePendingInvitesOnSignIn({
        user: { id: 'user-1', email: 'owner@example.com' },
      }),
    ).resolves.toBeUndefined();
  });
});
