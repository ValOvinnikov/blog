import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { errorResult, okResult } from '@blog/utils';
import { getSiteConfig } from '@web/server/site-config/get-site-config/get-site-config';
import { logger } from '@web/utils/logger/logger';

import { getThemeTokens } from './get-theme-tokens';

vi.mock('@web/server/site-config/get-site-config/get-site-config', () => ({
  getSiteConfig: vi.fn(),
}));

describe('getThemeTokens', () => {
  it('resolves theme tokens from the site_config row on success', async () => {
    const rowAccentHue =
      PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue;
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        preset: PRESET_ID.EDITORIAL,
        accentHue: rowAccentHue,
        headingFont:
          PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.headingFont,
        bodyFont: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.bodyFont,
        radiusScale:
          PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.radiusScale,
        density: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.density,
      } as never),
    );

    const tokens = await getThemeTokens();

    expect(tokens.accentHue).toBe(rowAccentHue);
    expect(tokens.logoHue).toBe(rowAccentHue);
  });

  it('forwards an explicitly supplied tenant to getSiteConfig', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(
      okResult({
        preset: PRESET_ID.CONSOLE,
        accentHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
        headingFont: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.headingFont,
        bodyFont: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.bodyFont,
        radiusScale: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.radiusScale,
        density: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.density,
      } as never),
    );

    await getThemeTokens('tenant-1');

    expect(getSiteConfig).toHaveBeenCalledWith('tenant-1');
  });

  it('falls back to the Console preset tokens and logs when the fetch fails', async () => {
    vi.mocked(getSiteConfig).mockResolvedValue(errorResult(new Error('boom')));

    const tokens = await getThemeTokens();

    expect(tokens).toEqual(
      expect.objectContaining({
        logoHue: PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens.accentHue,
      }),
    );
    expect(vi.mocked(logger.error)).toHaveBeenCalledWith(
      'theme_tokens.site_config_fetch_failed',
      expect.objectContaining({ error: expect.any(Error) }),
    );
  });
});
