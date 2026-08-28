import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import LookPage from './page';

const { authMock, getAdminByUserIdMock, getTenantByIdMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(LookPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(`<${LookPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getSiteConfigMock.mockReset();
    vi.mocked(redirect).mockClear();
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('renders Console defaults for a platform operator with no saved site_config row yet', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
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
