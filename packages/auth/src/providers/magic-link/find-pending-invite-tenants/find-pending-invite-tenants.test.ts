import {
  MOCK_INVITE_ID,
  MOCK_OTHER_INVITE_ID,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
} from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_EMAIL } from '@blog/auth/testing/session-fixtures';
import { LOCALE_ISO_CODES } from '@blog/config/constants';

import { findPendingInviteTenants } from './find-pending-invite-tenants';

const OTHER_TENANT_NAME = 'Other Corp';

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
      { id: MOCK_INVITE_ID, tenantId: MOCK_TENANT_ID },
      { id: MOCK_OTHER_INVITE_ID, tenantId: MOCK_OTHER_TENANT_ID },
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      {
        id: MOCK_TENANT_ID,
        name: MOCK_TENANT_NAME,
        locale: LOCALE_ISO_CODES.FR,
      },
      {
        id: MOCK_OTHER_TENANT_ID,
        name: OTHER_TENANT_NAME,
        locale: LOCALE_ISO_CODES.EN,
      },
    ]);

    const result = await findPendingInviteTenants(MOCK_EMAIL);

    expect(listTenantsByIdsMock).toHaveBeenCalledWith([
      MOCK_TENANT_ID,
      MOCK_OTHER_TENANT_ID,
    ]);
    expect(result).toEqual([
      { name: MOCK_TENANT_NAME, locale: LOCALE_ISO_CODES.FR },
      { name: OTHER_TENANT_NAME, locale: LOCALE_ISO_CODES.EN },
    ]);
  });
});
