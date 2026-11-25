import { NO_ACCESS_REASON } from '@platform/constants/no-access';
import { mockAdmin } from '@platform/testing/admins/fixtures';
import {
  MOCK_PLATFORM_ORIGIN,
  MOCK_SIGN_IN_USER_ID,
} from '@platform/testing/auth/fixtures';
import { mockedPartialAuth } from '@platform/testing/auth/mocked-auth';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { adminRoutes } from '@platform/utils/routes/routes';
import { HTTP_STATUS } from '@shinefold/config';

import { GET } from './route';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@shinefold/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

const getAdminInvite = () =>
  GET(new Request(new URL(adminRoutes.adminInvite(), MOCK_PLATFORM_ORIGIN)));

const locationOf = (response: Response) => response.headers.get('location');

describe(GET, () => {
  beforeEach(() => {
    mockedPartialAuth.mockResolvedValue({ user: { id: MOCK_SIGN_IN_USER_ID } });
  });

  it('sends a signed-out visitor to sign-in, back here afterwards', async () => {
    mockedPartialAuth.mockResolvedValueOnce(null);

    const response = await getAdminInvite();

    expect(response.status).toBe(HTTP_STATUS.TEMPORARY_REDIRECT);
    expect(locationOf(response)).toBe(
      new URL(
        adminRoutes.signIn(adminRoutes.adminInvite()),
        MOCK_PLATFORM_ORIGIN,
      ).href,
    );
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('says the invite is no longer valid to a non-admin', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(undefined);

    const response = await getAdminInvite();

    expect(getAdminByUserIdMock).toHaveBeenCalledWith(MOCK_SIGN_IN_USER_ID);
    expect(locationOf(response)).toBe(
      new URL(
        adminRoutes.noAccess(NO_ACCESS_REASON.ADMIN_INVITE),
        MOCK_PLATFORM_ORIGIN,
      ).href,
    );
  });

  it('opens the tenants list for an admin', async () => {
    getAdminByUserIdMock.mockResolvedValueOnce(mockAdmin());

    const response = await getAdminInvite();

    expect(locationOf(response)).toBe(
      new URL(adminRoutes.tenants(), MOCK_PLATFORM_ORIGIN).href,
    );
  });
});
