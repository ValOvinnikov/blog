import {
  CARD_STYLE,
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';

import { toThemeTokens } from './to-theme-tokens';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/config')>()),
  isAccentHueAccessible: vi.fn(),
}));

const mockedIsAccentHueAccessible = vi.mocked(isAccentHueAccessible);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/config')>('@blog/config');
  mockedIsAccentHueAccessible.mockImplementation(actual.isAccentHueAccessible);
});

describe(toThemeTokens, () => {
  it('falls back to the console preset when there is no site_config row', () => {
    const result = toThemeTokens(undefined);

    const consoleTokens = PRESET_REGISTRY[PRESET_ID.CONSOLE].themeTokens;
    expect(result).toEqual({
      ...consoleTokens,
      logoHue: consoleTokens.accentHue,
      cardStyle: CARD_STYLE.ACCENT_BAR,
    });
  });

  it('returns the editorial preset unchanged when the row sets no overrides', () => {
    const result = toThemeTokens({
      preset: PRESET_ID.EDITORIAL,
      accentHue: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.accentHue,
      headingFont: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.headingFont,
      bodyFont: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.bodyFont,
      radiusScale: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.radiusScale,
      density: PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens.density,
      cardStyle: PRESET_REGISTRY[PRESET_ID.EDITORIAL].cardStyle,
    });

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL];
    expect(result).toEqual({
      ...editorial.themeTokens,
      logoHue: editorial.themeTokens.accentHue,
      cardStyle: editorial.cardStyle,
    });
  });

  it("keeps the row's card style over its preset's", () => {
    const result = toThemeTokens({
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
      cardStyle: CARD_STYLE.OUTLINED,
    });

    expect(result.cardStyle).toBe(CARD_STYLE.OUTLINED);
  });

  it('resolves accentHue and logoHue independently (Indigo reproduction)', () => {
    const result = toThemeTokens({
      preset: PRESET_ID.CONSOLE,
      accentHue: 65,
      logoHue: 274,
      headingFont: 'SPACE_GROTESK',
      bodyFont: 'NEWSREADER',
      radiusScale: 'MD',
      density: 'DEFAULT',
      cardStyle: CARD_STYLE.ACCENT_BAR,
    });

    expect(result.accentHue).toBe(65);
    expect(result.logoHue).toBe(274);
  });

  it('falls back to the preset accentHue when the row accentHue fails the AA guard', () => {
    mockedIsAccentHueAccessible.mockReturnValue(false);

    const result = toThemeTokens({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 310,
      headingFont: 'FRAUNCES',
      bodyFont: 'INTER',
      radiusScale: 'SM',
      density: 'COMPACT',
      cardStyle: CARD_STYLE.ACCENT_BAR,
    });

    const editorial = PRESET_REGISTRY[PRESET_ID.EDITORIAL].themeTokens;
    expect(result.accentHue).toBe(editorial.accentHue);
    expect(result.logoHue).toBe(editorial.accentHue);
  });
});
