import { PRESET_ID, PRESET_REGISTRY } from '@blog/config';
import { makeRawThemeSettings } from '@blog/service/testing/global/fixtures';
import { mockRun } from '@blog/service/testing/mock-run-query';

import { getTheme } from './loader';

vi.mock('@blog/service/sanity/query', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/service/sanity/query')>()),
  runQuery: vi.fn(),
}));

describe('getTheme', () => {
  it('falls back to the console preset when no settings_theme document exists', async () => {
    mockRun.mockResolvedValue(null);

    const result = await getTheme();

    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
    expect(result).toEqual({
      ...consoleTokens,
      logoHue: consoleTokens.accentHue,
    });
  });

  it('returns the editorial preset unchanged when the document sets no overrides', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL }),
    );

    const result = await getTheme();

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result).toEqual({ ...editorial, logoHue: editorial.accentHue });
  });

  it('layers a single accentHue override on top of the editorial preset', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({ preset: PRESET_ID.EDITORIAL, accentHue: 200 }),
    );

    const result = await getTheme();

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result).toEqual({
      ...editorial,
      accentHue: 200,
      logoHue: 200,
    });
  });

  it('resolves accentHue and logoHue independently (Indigo reproduction)', async () => {
    mockRun.mockResolvedValue(
      makeRawThemeSettings({
        preset: PRESET_ID.CONSOLE,
        accentHue: 65,
        logoHue: 274,
      }),
    );

    const result = await getTheme();

    expect(result.accentHue).toBe(65);
    expect(result.logoHue).toBe(274);
  });
});
