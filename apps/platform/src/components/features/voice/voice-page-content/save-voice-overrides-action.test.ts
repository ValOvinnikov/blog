import {
  LOCALE_ISO_CODES,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config/constants';
import { requireTenantMembership } from '@platform/server/auth/require-tenant-membership';

import { saveVoiceOverridesAction } from './save-voice-overrides-action';

const { getSiteConfigMock, upsertSiteConfigMock, revalidateSiteConfigMock } =
  vi.hoisted(() => ({
    getSiteConfigMock: vi.fn(),
    upsertSiteConfigMock: vi.fn(),
    revalidateSiteConfigMock: vi.fn(),
  }));

vi.mock('@platform/server/auth/require-tenant-membership');

vi.mock('@platform/server/site-config/revalidate-site-config', () => ({
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

const requireTenantMembershipMock = vi.mocked<
  (tenantId: string) => Promise<unknown>
>(requireTenantMembership);

const tenant = { id: 'tenant-1' };

const overrides = { notFoundSupportingText: 'Custom 404 copy.' };

const overridesByLocale = {
  [LOCALE_ISO_CODES.EN]: overrides,
  [LOCALE_ISO_CODES.DE]: { ...overrides, notFoundHeading: 'Nicht gefunden' },
};

describe(saveVoiceOverridesAction, () => {
  beforeEach(() => {
    requireTenantMembershipMock.mockReset();
    getSiteConfigMock.mockReset();
    upsertSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockReset();
    revalidateSiteConfigMock.mockResolvedValue(undefined);
    getSiteConfigMock.mockResolvedValue(undefined);
    upsertSiteConfigMock.mockResolvedValue({ ok: true });
    requireTenantMembershipMock.mockResolvedValue({
      tenant,
      membership: { role: 'OWNER' },
    });
  });

  it('resolves the tenant from the checked membership, never a bare client-supplied id', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

    expect(requireTenantMembershipMock).toHaveBeenCalledWith('tenant-1');
    expect(getSiteConfigMock).toHaveBeenCalledWith('tenant-1');
    expect(upsertSiteConfigMock).toHaveBeenCalledWith(
      'tenant-1',
      expect.objectContaining({ voiceOverridesByLocale: overridesByLocale }),
    );
  });

  it('falls back to CONSOLE preset defaults when the tenant has no site_config row', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

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
      voiceOverridesByLocale: overridesByLocale,
    });
  });

  it('round-trips the existing theme fields so a Voice save never resets Look', async () => {
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
    upsertSiteConfigMock.mockResolvedValue({ ok: true });

    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

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
      voiceOverridesByLocale: overridesByLocale,
    });
  });

  it('returns ok:false without throwing when the upsert fails', async () => {
    upsertSiteConfigMock.mockRejectedValue(new Error('db down'));

    const result = await saveVoiceOverridesAction(
      'tenant-1',
      overridesByLocale,
    );

    expect(result).toEqual({ ok: false });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
  });

  it('returns the rejected fields per language without revalidating', async () => {
    const fieldErrorsByLocale = {
      [LOCALE_ISO_CODES.DE]: {
        notFoundHeading: 'Must be 100 characters or fewer.',
      },
    };
    upsertSiteConfigMock.mockResolvedValue({ ok: false, fieldErrorsByLocale });

    const result = await saveVoiceOverridesAction(
      'tenant-1',
      overridesByLocale,
    );

    expect(result).toEqual({ ok: false, fieldErrorsByLocale });
    expect(revalidateSiteConfigMock).not.toHaveBeenCalled();
  });

  it('returns ok:true on a successful save', async () => {
    const result = await saveVoiceOverridesAction(
      'tenant-1',
      overridesByLocale,
    );

    expect(result).toEqual({ ok: true });
  });

  it('calls the site-config revalidation webhook after a successful save', async () => {
    await saveVoiceOverridesAction('tenant-1', overridesByLocale);

    expect(revalidateSiteConfigMock).toHaveBeenCalledTimes(1);
  });
});
