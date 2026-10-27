import {
  CARD_STYLE,
  HEADER_CONTROL_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';
import { faker } from '@faker-js/faker';

import { toThemeTokens } from './to-theme-tokens';

faker.seed(6012);

const CONSOLE = PRESET_REGISTRY[PRESET_ID.CONSOLE];
const EDITORIAL = PRESET_REGISTRY[PRESET_ID.EDITORIAL];
const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 360 });
const MOCK_LOGO_HUE = faker.number.int({ min: 0, max: 360 });
const MOCK_UNUSABLE_ACCENT_HUE = Number.NaN;

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

describe(toThemeTokens, () => {
  it('falls back to the console preset when there is no site config row', () => {
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

  it('resolves the accent hue and the logo hue independently', () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
    });

    expect(result.accentHue).toBe(MOCK_ACCENT_HUE);
    expect(result.logoHue).toBe(MOCK_LOGO_HUE);
  });

  it("falls back to the preset's accent hue when the row's hue is unusable", () => {
    const result = toThemeTokens({
      ...EDITORIAL_ROW,
      accentHue: MOCK_UNUSABLE_ACCENT_HUE,
    });

    expect(result.accentHue).toBe(EDITORIAL.themeTokens.accentHue);
    expect(result.logoHue).toBe(EDITORIAL.themeTokens.accentHue);
  });
});
