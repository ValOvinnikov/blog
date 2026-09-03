import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import TenantByIdLayout from './layout';

const { authMock, getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
  }),
);

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
  },
}));

const setup = customRenderAsync(TenantByIdLayout, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
  children: <div>tenant content</div>,
});

describe(`<${TenantByIdLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row — this is what keeps the operator-only Studio route ungated by URL alone', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s for an unknown tenant id', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');
  });

  it('renders the gated content bare, with no AdminShell chrome, for a platform operator', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.getByText('tenant content')).toBeVisible();
    expect(
      screen.queryByText('Platform', { selector: 'p' }),
    ).not.toBeInTheDocument();
    expect(redirect).not.toHaveBeenCalled();
  });
});
