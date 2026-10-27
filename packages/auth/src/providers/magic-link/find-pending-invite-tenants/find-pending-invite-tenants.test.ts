import {
  MOCK_OTHER_INVITE_ID,
  MOCK_OTHER_TENANT_ID,
  MOCK_TENANT_ID,
  MOCK_TENANT_NAME,
  mockPendingInvite,
  mockTenant,
} from '@blog/auth/testing/magic-link-fixtures';
import { MOCK_EMAIL } from '@blog/auth/testing/session-fixtures';
import { LOCALE_ISO_CODES } from '@blog/config/constants';
import { faker } from '@faker-js/faker';

import { findPendingInviteTenants } from './find-pending-invite-tenants';

faker.seed(6027);

const MOCK_OTHER_TENANT_NAME = faker.lorem.words(2);

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
  it('returns no tenants, looking none up, when there are no pending invites', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([]);

    const result = await findPendingInviteTenants(MOCK_EMAIL);

    expect(result).toEqual([]);
    expect(listTenantsByIdsMock).not.toHaveBeenCalled();
  });

  it('resolves the name and default language of every invite tenant', async () => {
    findPendingInviteByEmailMock.mockResolvedValue([
      mockPendingInvite(),
      mockPendingInvite({
        id: MOCK_OTHER_INVITE_ID,
        tenantId: MOCK_OTHER_TENANT_ID,
      }),
    ]);
    listTenantsByIdsMock.mockResolvedValue([
      mockTenant({ locale: LOCALE_ISO_CODES.FR }),
      mockTenant({
        id: MOCK_OTHER_TENANT_ID,
        name: MOCK_OTHER_TENANT_NAME,
        locale: LOCALE_ISO_CODES.EN,
      }),
    ]);

    const result = await findPendingInviteTenants(MOCK_EMAIL);

    expect(listTenantsByIdsMock).toHaveBeenCalledWith([
      MOCK_TENANT_ID,
      MOCK_OTHER_TENANT_ID,
    ]);
    expect(result).toEqual([
      { name: MOCK_TENANT_NAME, locale: LOCALE_ISO_CODES.FR },
      { name: MOCK_OTHER_TENANT_NAME, locale: LOCALE_ISO_CODES.EN },
    ]);
  });
});
