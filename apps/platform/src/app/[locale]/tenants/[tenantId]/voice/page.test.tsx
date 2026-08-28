import { customRenderAsync, screen } from '@platform/testing/custom-render';
import { mockDbConstants } from '@platform/testing/mock-db-constants';
import userEvent from '@testing-library/user-event';
import { redirect } from 'next/navigation';

import VoicePage from './page';

const ADVANCED_SUMMARY = 'Advanced — 19 curated strings, 4 groups';

// Advanced starts collapsed — open it before reading any curated field.
const openAdvanced = async () => {
  await userEvent.setup().click(screen.getByText(ADVANCED_SUMMARY));
};

const { authMock, getAdminByUserIdMock, getTenantByIdMock, getSiteConfigMock } =
  vi.hoisted(() => ({
    authMock: vi.fn(),
    getAdminByUserIdMock: vi.fn(),
    getTenantByIdMock: vi.fn(),
    getSiteConfigMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/auth', () => ({ auth: authMock }));

vi.mock('@blog/db', async () => ({
  ...(await mockDbConstants()),
  queries: {
    admins: { getAdminByUserId: getAdminByUserIdMock },
    tenants: { getTenantById: getTenantByIdMock },
    siteConfig: { getSiteConfig: getSiteConfigMock },
  },
}));

const setup = customRenderAsync(VoicePage, {
  params: Promise.resolve({ tenantId: 'tenant-1' }),
});

describe(`<${VoicePage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getAdminByUserIdMock.mockReset();
    getTenantByIdMock.mockReset();
    getSiteConfigMock.mockReset();
    vi.mocked(redirect).mockClear();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getAdminByUserIdMock.mockResolvedValue({ id: 'admin-1', role: 'ADMIN' });
    getTenantByIdMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
  });

  it('404s when the signed-in user has no admins row', async () => {
    getAdminByUserIdMock.mockResolvedValue(undefined);

    await expect(setup()).rejects.toThrow('NEXT_NOT_FOUND');

    expect(redirect).not.toHaveBeenCalled();
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
