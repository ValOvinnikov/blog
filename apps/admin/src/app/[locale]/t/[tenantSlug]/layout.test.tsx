import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import TenantLayout from './layout';

const {
  authMock,
  getTenantBySlugMock,
  getMembershipMock,
  getAdminByUserIdMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getMembershipMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantBySlug: getTenantBySlugMock },
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
  },
}));

const setup = customRenderAsync(TenantLayout, {
  params: Promise.resolve({ tenantSlug: 'acme' }),
  children: <div>tenant content</div>,
});

describe(`<${TenantLayout.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getAdminByUserIdMock.mockResolvedValue(undefined);
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantBySlugMock).not.toHaveBeenCalled();
  });

  it('redirects to /unauthorized when the signed-in user has no membership on this tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(getMembershipMock).toHaveBeenCalledWith('user-1', 'tenant-1');
    expect(redirect).toHaveBeenCalledWith('/unauthorized');
  });

  it('renders the gated content for a member of the routed tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    getMembershipMock.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByText('tenant content')).toBeVisible();
    expect(redirect).not.toHaveBeenCalled();
  });

  it('renders both the Platform and Tenant sections in the sidebar', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      name: 'Acme Inc.',
      primaryDomain: 'acme.example.com',
    });
    getMembershipMock.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
      createdAt: new Date(),
    });

    await setup();

    expect(screen.getByText('Platform')).toBeVisible();
    expect(screen.getByText('Tenant · acme')).toBeVisible();
  });
});
