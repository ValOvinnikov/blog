import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { redirect } from 'next/navigation';

import PlatformLayout from './layout';

const { authMock, getAdminByUserIdMock } = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: { admins: { getAdminByUserId: getAdminByUserIdMock } },
}));

const setup = customRenderAsync(PlatformLayout, {
  children: <div>content</div>,
});

describe(`<${PlatformLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying admins when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/api/auth/signin');
    expect(getAdminByUserIdMock).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(getAdminByUserIdMock).toHaveBeenCalledWith('user-1');
    expect(vi.mocked(redirect)).toHaveBeenCalledWith('/unauthorized');
  });

  it('renders the gated content for a signed-in admin', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByText('content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });
});
