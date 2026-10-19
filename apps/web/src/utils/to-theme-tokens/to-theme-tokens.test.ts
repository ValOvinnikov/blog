import {
  CARD_STYLE,
  HEADER_CONTROL_STYLE,
  isAccentHueAccessible,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';

import { toThemeTokens } from './to-theme-tokens';

vi.mock('@blog/config', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@blog/config')>()),
  isAccentHueAccessible: vi.fn(),
}));

const CONSOLE = PRESET_REGISTRY[PRESET_ID.CONSOLE];
const EDITORIAL = PRESET_REGISTRY[PRESET_ID.EDITORIAL];
const ACCENT_HUE = 65;
const LOGO_HUE = 274;
const INACCESSIBLE_HUE = 310;

const CONSOLE_ROW = {
  preset: PRESET_ID.CONSOLE,
  ...CONSOLE.themeTokens,
  cardStyle: CONSOLE.cardStyle,
  headerControlStyle: CONSOLE.headerControlStyle,
};

const EDITORIAL_ROW = {
  preset: PRESET_ID.EDITORIAL,
  ...EDITORIAL.themeTokens,
  cardStyle: EDITORIAL.cardStyle,
  headerControlStyle: EDITORIAL.headerControlStyle,
};

const mockedIsAccentHueAccessible = vi.mocked(isAccentHueAccessible);

beforeEach(async () => {
  const actual =
    await vi.importActual<typeof import('@blog/config')>('@blog/config');
  mockedIsAccentHueAccessible.mockImplementation(actual.isAccentHueAccessible);
});

describe(toThemeTokens, () => {
  it('falls back to the console preset when there is no site_config row', () => {
    const result = toThemeTokens(undefined);

    expect(result).toEqual({
      ...CONSOLE.themeTokens,
      logoHue: CONSOLE.themeTokens.accentHue,
      cardStyle: CONSOLE.cardStyle,
      headerControlStyle: CONSOLE.headerControlStyle,
    });
  });

  it('returns the editorial preset unchanged when the row sets no overrides', () => {
    const result = toThemeTokens(EDITORIAL_ROW);

    expect(result).toEqual({
      ...EDITORIAL.themeTokens,
      logoHue: EDITORIAL.themeTokens.accentHue,
      cardStyle: EDITORIAL.cardStyle,
      headerControlStyle: EDITORIAL.headerControlStyle,
    });
  });

  it("keeps the row's card style over its preset's", () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      cardStyle: CARD_STYLE.OUTLINED,
    });

    expect(result.cardStyle).toBe(CARD_STYLE.OUTLINED);
  });

  it("keeps the row's header control style over its preset's", () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
    });

    expect(result.headerControlStyle).toBe(HEADER_CONTROL_STYLE.SOFT);
  });

  it('resolves accentHue and logoHue independently (Indigo reproduction)', () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      accentHue: ACCENT_HUE,
      logoHue: LOGO_HUE,
    });

    expect(result.accentHue).toBe(ACCENT_HUE);
    expect(result.logoHue).toBe(LOGO_HUE);
  });

  it('falls back to the preset accentHue when the row accentHue fails the AA guard', () => {
    mockedIsAccentHueAccessible.mockReturnValue(false);

    const result = toThemeTokens({
      ...EDITORIAL_ROW,
      accentHue: INACCESSIBLE_HUE,
    });

    expect(result.accentHue).toBe(EDITORIAL.themeTokens.accentHue);
    expect(result.logoHue).toBe(EDITORIAL.themeTokens.accentHue);
  });
});
