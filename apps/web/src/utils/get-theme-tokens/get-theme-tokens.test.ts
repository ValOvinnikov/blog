import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { getSiteConfig } from '@web/server/site-config/get-site-config';

import { getThemeTokens } from './get-theme-tokens';

vi.mock('@web/server/site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

describe('getThemeTokens', () => {
  it('resolves theme tokens from the site_config row on success', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: true,
      data: {
        preset: PRESET_ID.EDITORIAL,
        accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
        headingFont:
          PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.headingFont,
        bodyFont: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.bodyFont,
        radiusScale:
          PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.radiusScale,
        density: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.density,
      } as never,
    });

    const tokens = await getThemeTokens();

    expect(tokens.chromeOn).toBe(
      PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.chromeOn,
    );
  });

  it('forwards an explicitly supplied tenant to getSiteConfig', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: true,
      data: {
        preset: PRESET_ID.CONSOLE,
        accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
        headingFont: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.headingFont,
        bodyFont: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.bodyFont,
        radiusScale: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.radiusScale,
        density: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.density,
      } as never,
    });

    await getThemeTokens('tenant-1');

    expect(getSiteConfig).toHaveBeenCalledWith('tenant-1');
  });

  it('falls back to the Console preset tokens and logs when the fetch fails', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(getSiteConfig).mockResolvedValue({
      ok: false,
      error: new Error('boom'),
    });

    const tokens = await getThemeTokens();

    expect(tokens).toEqual(
      expect.objectContaining({
        chromeOn: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.chromeOn,
      }),
    );
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('theme_tokens.site_config_fetch_failed'),
    );

    errorSpy.mockRestore();
  });
});
