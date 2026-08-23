import { findPendingInviteTenantNames } from './find-pending-invite-tenant-names';

const { findPendingInviteByEmailMock, listTenantsByIdsMock } = vi.hoisted(
  () => ({
    findPendingInviteByEmailMock: vi.fn(),
    listTenantsByIdsMock: vi.fn(),
  }),
);

vi.mock('@blog/db', () => ({
  queries: {
    membershipInvites: {
      findPendingInviteByEmail: findPendingInviteByEmailMock,
    },
    tenants: { listTenantsByIds: listTenantsByIdsMock },
  },
}));

describe(findPendingInviteTenantNames, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset();
    listTenantsByIdsMock.mockReset();
  });

  it('returns an empty array without a tenant lookup when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    const result = await findPendingInviteTenantNames('nobody@example.com');

    expect(result).toEqual([]);
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves the tenant names of every pending invite', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
      { id: 'invite-2', tenantId: 'tenant-2' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog' },
      { id: 'tenant-2', name: 'Other Corp' },
    ]);

    const result = await findPendingInviteTenantNames('owner@example.com');

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1', 'tenant-2']);
    expect(result).toEqual(['Acme Blog', 'Other Corp']);
  });
});
