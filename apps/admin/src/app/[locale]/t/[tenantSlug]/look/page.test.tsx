import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { redirect } from 'next/navigation';

import LookPage from './page';

const { authMock, getTenantBySlugMock, getMembershipMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    getTenantBySlugMock: vi.fn(),
    getMembershipMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', () => ({
  queries: {
    tenants: { getTenantBySlug: getTenantBySlugMock },
    memberships: { getMembership: getMembershipMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(LookPage, {
  params: Promise.resolve({ tenantSlug: 'acme' }),
});

describe(`<${LookPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    getSiteConfigMock.mockReset();
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
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/unauthorized');
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('renders Console defaults for a member of the tenant with no saved site_config row yet', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
    getMembershipMock.mockResolvedValue({ id: 'm-1', role: 'OWNER' });
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Look' })).toBeVisible();
    expect(screen.getByRole('radio', { name: 'Console' })).toHaveAttribute(
      'aria-checked',
      'true',
    );
  });
});
