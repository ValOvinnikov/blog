import { auth } from '@platform/server/auth/auth';
import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import { redirect } from 'next/navigation';
import type { Session } from 'next-auth';

import FeaturesPage from './page';

const {
  getAdminByUserIdMock,
  getTenantByIdMock,
  getSettingsFeaturesAndPresetMock,
} = vi.hoisted(() => ({
  getAdminByUserIdMock: vi.fn(),
  getTenantByIdMock: vi.fn(),
  getSettingsFeaturesAndPresetMock: vi.fn(),
}));

vi.mock('@platform/server/auth/auth');

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    settingsFeatures: {
      getSettingsFeaturesAndPreset: getSettingsFeaturesAndPresetMock,
    },
  },
}));

const authMock = vi.mocked<() => Promise<Partial<Session> | null>>(auth);

const setup = customRenderAsync(FeaturesPage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(`<${FeaturesPage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getSettingsFeaturesAndPresetMock.mockReset();
    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getSettingsFeaturesAndPresetMock.mockResolvedValue({
      features: undefined,
      preset: undefined,
    });
  });

  it('redirects to sign-in without querying the tenant when there is no session', async () => {
    authMock.mockResolvedValue(null);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/api/auth/signin');
    expect(getTenantByIdMock).not.toHaveBeenCalled();
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
    expect(getSettingsFeaturesAndPresetMock).not.toHaveBeenCalled();
  });

  it('renders preset featureDefaults for an operator with no settings_features row', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      plan: 'GROWTH',
    });

    await setup();

    expect(getSettingsFeaturesAndPresetMock).toHaveBeenCalledWith('tenant-1');
    expect(screen.getByRole('heading', { name: 'Features' })).toBeVisible();
    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-checked',
      '',
    );
  });

  it('renders the GROWTH-only toggles as locked for a FREE-plan tenant', async () => {
    getTenantByIdMock.mockResolvedValue({
      id: 'tenant-1',
      plan: 'FREE',
    });

    await setup();

    expect(screen.getByRole('switch', { name: 'Analytics' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(screen.getByRole('switch', { name: 'Bookmarks' })).toHaveAttribute(
      'data-disabled',
      '',
    );
    expect(
      screen.getByRole('switch', { name: 'Cookie consent banner' }),
    ).not.toHaveAttribute('data-disabled');
  });
});
