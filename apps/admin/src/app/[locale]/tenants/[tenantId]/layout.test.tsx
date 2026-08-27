import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import TenantByIdLayout from './layout';

const { authMock, getAdminByUserIdMock, getTenantByIdMock } = vi.hoisted(
  () => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
  }),
);

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

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

  it('redirects to /unauthorized when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/unauthorized');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('renders the gated content for a platform operator', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.getByText('tenant content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders both the Platform and Tenant sections in the sidebar', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({
      id: 'admin-1',
      userId: 'user-1',
      role: 'ADMIN',
      createdAt: new Date(),
    });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });

    await setup();

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('Tenant · Acme Inc.')).toBeVisible();
  });
});
