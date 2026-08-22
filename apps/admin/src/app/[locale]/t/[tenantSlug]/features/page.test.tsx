import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import { redirect } from 'next/navigation';

import FeaturesPage from './page';

const {
  authMock,
  getTenantBySlugMock,
  getMembershipMock,
  getSettingsFeaturesMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getMembershipMock: vi.fn(),
  getSettingsFeaturesMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantBySlug: getTenantBySlugMock },
    memberships: { getMembership: getMembershipMock },
    settingsFeatures: { getSettingsFeatures: getSettingsFeaturesMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(FeaturesPage, {
  params: Promise.resolve({ tenantSlug: 'acme' }),
});

describe(`<${FeaturesPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    getSettingsFeaturesMock.mockReset();
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
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      plan: 'FREE',
    });
    getMembershipMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/unauthorized');
    expect(getSettingsFeaturesMock).not.toHaveBeenCalled();
  });

  it('renders the preset featureDefaults for a member of the tenant with no settings_features row yet', async () => {
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      plan: 'FREE',
    });
    getMembershipMock.mockResolvedValue({ id: 'm-1', role: 'OWNER' });
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
    getTenantBySlugMock.mockResolvedValue({
      id: 'tenant-1',
      slug: 'acme',
      plan: 'FREE',
    });
    getMembershipMock.mockResolvedValue({ id: 'm-1', role: 'OWNER' });
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
