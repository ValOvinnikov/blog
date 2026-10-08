import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { findPendingInviteTenants } from './find-pending-invite-tenants';

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

describe(findPendingInviteTenants, () => {
  beforeEach(() => {
    findPendingInviteByEmailMock.mockReset();
    listTenantsByIdsMock.mockReset();
  });

  it('returns an empty array without a tenant lookup when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    const result = await findPendingInviteTenants('nobody@example.com');

    expect(result).toEqual([]);
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves the name and default language of every pending invite tenant', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      { id: 'invite-1', tenantId: 'tenant-1' },
      { id: 'invite-2', tenantId: 'tenant-2' },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      { id: 'tenant-1', name: 'Acme Blog', locale: LOCALE_ISO_CODES.FR },
      { id: 'tenant-2', name: 'Other Corp', locale: LOCALE_ISO_CODES.EN },
    ]);

    const result = await findPendingInviteTenants('owner@example.com');

    expect(listTenantsByIdsMock).toHaveBeenCalledWith(['tenant-1', 'tenant-2']);
    expect(result).toEqual([
      { name: 'Acme Blog', locale: LOCALE_ISO_CODES.FR },
      { name: 'Other Corp', locale: LOCALE_ISO_CODES.EN },
    ]);
  });
});
