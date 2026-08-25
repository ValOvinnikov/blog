import { PRESET_ID, PRESET_REGISTRY } from '@blog/config/constants';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

const {
  requireTenantMembershipMock,
  getSiteConfigMock,
  upsertSiteConfigMock,
  revalidateSiteConfigMock,
} = vi.hoisted(() => ({
  requireTenantMembershipMock: vi.fn(),
  getSiteConfigMock: vi.fn(),
  upsertSiteConfigMock: vi.fn(),
  revalidateSiteConfigMock: vi.fn(),
}));

vi.mock('@admin/server/auth/require-tenant-membership', () => ({
  requireTenantMembership: requireTenantMembershipMock,
}));

vi.mock('@admin/server/site-config/revalidate-site-config', () => ({
  revalidateSiteConfig: revalidateSiteConfigMock,
}));

vi.mock('@blog/db', () => ({
  queries: {
    siteConfig: {
      getSiteConfig: getSiteConfigMock,
      upsertSiteConfig: upsertSiteConfigMock,
    },
  },
}));

const tenant = { id: 'tenant-1', slug: 'acme' };

const overrides = {
  notFoundMetaTitle: '',
  notFoundMetaDescription: '',
  notFoundCommandNotFound: '',
  notFoundDescription: 'Custom 404 copy.',
  notFoundReturnHome: '',
  terminalPromptHost: '',
  authPromptCommandSignIn: '',
  authPromptCommandAccount: '',
  bookmarksPromptCommand: '',
  accountPrivacyPromptCommand: '',
  accountNewsletterPromptCommand: '',
  accountIdentityPromptCommand: '',
  bookmarkToastSavedMessage: '',
  bookmarkToastRemovedMessage: '',
  blogListEmpty: '',
  topicEmpty: '',
  tagEmpty: '',
  topicsEmpty: '',
  bookmarksEmpty: '',
};

describe(saveVoiceOverridesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    getSiteConfigMock.mockReset();
    upsertSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    requireTenantMembershipMock.mockResolvedValue({
      tenant,
      membership: { role: 'OWNER' },
    });
  });

  it('resolves the tenant from the session-checked slug, not a client-supplied id', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockResolvedValue({});

    await saveVoiceOverridesAction('acme', overrides);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('acme');
    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ voiceOverrides: overrides }),
    );
  });

  it('falls back to the CONSOLE preset defaults when the tenant has no site_config row yet', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockResolvedValue({});

    await saveVoiceOverridesAction('acme', overrides);

    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', {
      preset: PRESET_ID.CONSOLE,
      accentHue: consoleTokens.accentHue,
      logoHue: undefined,
      headingFont: consoleTokens.headingFont,
      bodyFont: consoleTokens.bodyFont,
      radiusScale: consoleTokens.radiusScale,
      density: consoleTokens.density,
      logoAssetUrl: undefined,
      faviconAssetUrl: undefined,
      voiceOverrides: overrides,
    });
  });

  it("round-trips the tenant's existing theme fields unchanged so a Voice save never resets Look", async () => {
    getSiteConfigMock.mockResolvedValue({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      logoHue: 200,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      logoAssetUrl: 'https://blob.example.com/logo.png',
      faviconAssetUrl: 'https://blob.example.com/favicon.png',
      voiceOverrides: {},
    });
    upsertSiteConfigMock.mockResolvedValue({});

    await saveVoiceOverridesAction('acme', overrides);

    expect(upsertSiteConfigMock).toHaveBeenCalledWith('tenant-1', {
      preset: PRESET_ID.EDITORIAL,
      accentHue: 28,
      logoHue: 200,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      logoAssetUrl: 'https://blob.example.com/logo.png',
      faviconAssetUrl: 'https://blob.example.com/favicon.png',
      voiceOverrides: overrides,
    });
  });

  it('returns ok:false without throwing when the upsert fails', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockRejectedValue(new Error('db down'));

    const result = await saveVoiceOverridesAction('acme', overrides);

    expect(result).toEqual({ ok: false });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
  });

  it('returns ok:true on a successful save', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockResolvedValue({});

    const result = await saveVoiceOverridesAction('acme', overrides);

    expect(result).toEqual({ ok: true });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockResolvedValue({});

    await saveVoiceOverridesAction('acme', overrides);

    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });
});
