import { customRenderAsync, screen } from '@admin/testing/custom-render';
import { PRESET_ID } from '@blog/config/constants';
import { redirect } from 'next/navigation';

import VoicePage from './page';

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

const setup = customRenderAsync(VoicePage, {
  params: Promise.resolve({ tenantSlug: 'acme' }),
});

describe(`<${VoicePage.name}/>`, () => {
  beforeEach(() => {
    authMock.mockReset();
    getTenantBySlugMock.mockReset();
    getMembershipMock.mockReset();
    getSiteConfigMock.mockReset();
    vi.mocked(redirect).mockClear();

    authMock.mockResolvedValue({ user: { id: 'user-1' } });
    getTenantBySlugMock.mockResolvedValue({ id: 'tenant-1', slug: 'acme' });
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

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('');
    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveAttribute('placeholder', '~$');
  });

  it("resolves placeholders from the tenant's actual saved preset, not always CONSOLE", async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      voiceOverrides: {},
    });

    await setup();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).not.toHaveAttribute('placeholder');
  });

  it('renders a previously-saved override as the field value', async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.CONSOLE,
      voiceOverrides: { terminalPromptHost: 'guest@acme' },
    });

    await setup();

    expect(
      screen.getByRole('textbox', { name: 'Terminal Prompt Host' }),
    ).toHaveValue('guest@acme');
  });
});
