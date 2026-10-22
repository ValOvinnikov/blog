import { NEXT_NAVIGATION_ERROR, type TMaybeNull } from '@blog/config';
import { ADMIN_ROLE } from '@blog/db/constants';
import { auth } from '@platform/server/auth/auth';
import { makeAdmin } from '@platform/testing/admins/fixtures';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { adminRoutes } from '@platform/utils/routes/routes';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import BlockedSignupsLayout from './layout';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

const authMock = vi.mocked<() => Promise<TMaybeNull<Partial<Session>>>>(auth);

const setup = customRenderAsync(BlockedSignupsLayout, {
  children: <div>blocked sign-ups content</div>,
});

describe(BlockedSignupsLayout, () => {
  beforeEach(() => {
    authMock
      .mockReset()
      .mockResolvedValue({ user: { id: makeAdmin().userId } });
    getAdminByUserIdMock.mockReset();
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_REDIRECT);

    expect(redirect).toHaveBeenCalledWith(adminRoutes.signIn());
  });

  it.each([ADMIN_ROLE.ADMIN, ADMIN_ROLE.MODERATOR])(
    '404s for a %s',
    async (role) => {
      getAdminByUserIdMock.mockResolvedValue(makeAdmin({ role }));

      await expect(setup()).rejects.toThrow(
        NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND,
      );
    },
  );

  it('404s when the user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow(NEXT_NAVIGATION_ERROR.NEXT_NOT_FOUND);
  });

  it('renders the page for a SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue(
      makeAdmin({ role: ADMIN_ROLE.SUPERADMIN }),
    );

    await setup();

    const content = screen.getByText('blocked sign-ups content');

    expect(content).toBeVisible();
  });
});
