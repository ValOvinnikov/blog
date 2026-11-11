import {
  BUTTON_SHAPE,
  CARD_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  NAV_LINK_STYLE,
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
  headerControlShape: CONSOLE.headerControlShape,
  buttonShape: CONSOLE.buttonShape,
  navLinkStyle: CONSOLE.navLinkStyle,
};

const EDITORIAL_ROW = {
  preset: PRESET_ID.EDITORIAL,
  ...EDITORIAL.themeTokens,
  cardStyle: EDITORIAL.cardStyle,
  headerControlStyle: EDITORIAL.headerControlStyle,
  headerControlShape: EDITORIAL.headerControlShape,
  buttonShape: EDITORIAL.buttonShape,
  navLinkStyle: EDITORIAL.navLinkStyle,
};

describe(toThemeTokens, () => {
  it('falls back to the console preset when there is no site config row', () => {
    const result = toThemeTokens(undefined);

    expect(result).toEqual({
      ...CONSOLE.themeTokens,
      logoHue: CONSOLE.themeTokens.accentHue,
      cardStyle: CONSOLE.cardStyle,
      headerControlStyle: CONSOLE.headerControlStyle,
      headerControlShape: CONSOLE.headerControlShape,
      buttonShape: CONSOLE.buttonShape,
      navLinkStyle: CONSOLE.navLinkStyle,
    });
  });

  it('returns the editorial preset unchanged when the row sets no overrides', () => {
    const result = toThemeTokens(EDITORIAL_ROW);

    expect(result).toEqual({
      ...EDITORIAL.themeTokens,
      logoHue: EDITORIAL.themeTokens.accentHue,
      cardStyle: EDITORIAL.cardStyle,
      headerControlStyle: EDITORIAL.headerControlStyle,
      headerControlShape: EDITORIAL.headerControlShape,
      buttonShape: EDITORIAL.buttonShape,
      navLinkStyle: EDITORIAL.navLinkStyle,
    });
  });

  it.each([
    { field: 'cardStyle', value: CARD_STYLE.OUTLINED },
    { field: 'headerControlStyle', value: HEADER_CONTROL_STYLE.SOFT },
    { field: 'headerControlShape', value: HEADER_CONTROL_SHAPE.SQUARE },
    { field: 'buttonShape', value: BUTTON_SHAPE.PILL },
    { field: 'navLinkStyle', value: NAV_LINK_STYLE.UNDERLINE },
  ] as const)(
    "keeps the row's $field over its preset's",
    ({ field, value }) => {
      const result = toThemeTokens({ ...CONSOLE_ROW, [field]: value });

      expect(result[field]).toBe(value);
    },
  );

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
