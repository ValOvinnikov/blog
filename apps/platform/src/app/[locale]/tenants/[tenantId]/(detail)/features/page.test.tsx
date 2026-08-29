import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import FeaturesPage from './page';

const {
  authMock,
  getAdminByUserIdMock,
  getTenantByIdMock,
  getSettingsFeaturesMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(FeaturesPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(`<${FeaturesPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getSettingsFeaturesMock.mockReset();
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
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('renders the preset featureDefaults for a platform operator with no settings_features row yet', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      plan: 'FREE',
    });
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(getSettingsFeaturesMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Features' })).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Comments' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('renders the GROWTH-only toggles as locked for a FREE-plan tenant', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      plan: 'FREE',
    });
    getSettingsFeaturesMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();

    expect(screen.getByRole('switch', { name: 'Newsletter' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(
      screen.getByRole('switch', { name: 'Comments' }),
    ).not.toHaveAttribute('data-disabled');
  });
});
