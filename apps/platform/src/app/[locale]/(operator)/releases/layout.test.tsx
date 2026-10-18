import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import ReleasesLayout from './layout';

const { getAdminByUserIdMock } = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(ReleasesLayout, {
  children: <div>releases content</div>,
});

describe(ReleasesLayout, () => {
  beforeEach(() => {
    authMock.mockReset().mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockReset();
  });

  it('redirects to sign-in when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
  });

  it.each(['ADMIN', 'MODERATOR'])('404s for a %s', async (role) => {
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role });

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('404s when the user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders the page for a SUPERADMIN', async () => {
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      role: 'SUPERADMIN',
    });

    await setup();

    expect(screen.getByText('releases content')).toBeVisible();
  });
});
