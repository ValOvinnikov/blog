import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { mockDbConstants } from '@admin/testing/mock-db-constants';
import userEvent from '@testing-library/user-event';
import { redirect } from 'next/navigation';

import VoicePage from './page';

const ADVANCED_SUMMARY = 'Advanced — 19 curated strings, 4 groups';

// Advanced starts collapsed — open it before reading any curated field.
const openAdvanced = async () => {
  await userEvent.setup().click(screen.getByText(ADVANCED_SUMMARY));
};

const {
  authMock,
  getTenantBySlugMock,
  getMembershipMock,
  getAdminByUserIdMock,
  getSiteConfigMock,
} = vi.hoisted(() => ({
  authMock: vi.fn(),
  getTenantBySlugMock: vi.fn(),
  getMembershipMock: vi.fn(),
  getAdminByUserIdMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
}));

vi.mock('@admin/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    tenants: { getTenantBySlug: getTenantBySlugMock },
    memberships: { getMembership: getMembershipMock },
    admins: { getAdminByUserId: getAdminByUserIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(VoicePage, {
  params: Promise.resolve({ tenantSlug: 'acme' }),
});

describe(`<${VoicePage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getSiteConfigMock.mockReset();
    vi.mocked(redirect).mockClear();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
    getAdminByUserIdMock.mockResolvedValue(undefined);
    getMembershipMock.mockResolvedValue({
      id: 'membership-1',
      userId: 'user-1',
      tenantId: 'tenant-1',
      role: 'OWNER',
      createdAt: new Date(),
    });
  });

  it('redirects to /unauthorized when the signed-in user has no membership on this tenant', async () => {
    getMembershipMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_REDIRECT');

    expect(redirect).toHaveBeenCalledWith('/unauthorized');
    expect(getSiteConfigMock).not.toHaveBeenCalled();
  });

  it('shows every field blank, with CONSOLE placeholders, when the tenant has no site_config row yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);

    await setup();
    await openAdvanced();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveAttribute('placeholder', '~$');
  });
});
