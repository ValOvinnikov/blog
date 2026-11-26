import { faker } from '@faker-js/faker';
import {
  BUTTON_SHAPE,
  CARD_STYLE,
  DIVIDER_WIDTH,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  HEADING_CASE,
  HEADING_WEIGHT,
  IMAGE_PROPORTION,
  NAV_LINK_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  type TPresetBundle,
} from '@shinefold/config';
import {
  MOCK_PINK_HEX,
  MOCK_YELLOW_HEX,
} from '@shinefold/config/testing/button-colors';

import { toThemeTokens } from './to-theme-tokens';

faker.seed(6012);

const CONSOLE = PRESET_REGISTRY[PRESET_ID.CONSOLE];
const EDITORIAL = PRESET_REGISTRY[PRESET_ID.EDITORIAL];
const MOCK_ACCENT_HUE = faker.number.int({ min: 0, max: 360 });
const MOCK_LOGO_HUE = faker.number.int({ min: 0, max: 360 });
const MOCK_UNUSABLE_ACCENT_HUE = Number.NaN;

const presetStyles = ({
  cardStyle,
  headerControlStyle,
  headerControlShape,
  buttonShape,
  navLinkStyle,
  headingWeight,
  headingCase,
  imageProportion,
  dividerWidth,
}: TPresetBundle) => ({
  cardStyle,
  headerControlStyle,
  headerControlShape,
  buttonShape,
  navLinkStyle,
  headingWeight,
  headingCase,
  imageProportion,
  dividerWidth,
});

const CONSOLE_ROW = {
  preset: PRESET_ID.CONSOLE,
  ...CONSOLE.themeTokens,
  ...presetStyles(CONSOLE),
};

const EDITORIAL_ROW = {
  preset: PRESET_ID.EDITORIAL,
  ...EDITORIAL.themeTokens,
  ...presetStyles(EDITORIAL),
};

describe(toThemeTokens, () => {
  it('falls back to the console preset when there is no site config row', () => {
    const result = toThemeTokens(undefined);

    expect(result).toEqual({
      preset: PRESET_ID.CONSOLE,
      ...CONSOLE.themeTokens,
      logoHue: CONSOLE.themeTokens.accentHue,
      ...presetStyles(CONSOLE),
    });
  });

  it('returns the editorial preset unchanged when the row sets no overrides', () => {
    const result = toThemeTokens(EDITORIAL_ROW);

    expect(result).toEqual({
      preset: PRESET_ID.EDITORIAL,
      ...EDITORIAL.themeTokens,
      logoHue: EDITORIAL.themeTokens.accentHue,
      ...presetStyles(EDITORIAL),
    });
  });

  it.each([
    { field: 'cardStyle', value: CARD_STYLE.OUTLINED },
    { field: 'headerControlStyle', value: HEADER_CONTROL_STYLE.SOFT },
    { field: 'headerControlShape', value: HEADER_CONTROL_SHAPE.SQUARE },
    { field: 'buttonShape', value: BUTTON_SHAPE.PILL },
    { field: 'navLinkStyle', value: NAV_LINK_STYLE.UNDERLINE },
    { field: 'headingWeight', value: HEADING_WEIGHT.BOLD },
    { field: 'headingCase', value: HEADING_CASE.UPPERCASE },
    { field: 'imageProportion', value: IMAGE_PROPORTION.SQUARE },
    { field: 'dividerWidth', value: DIVIDER_WIDTH.BOLD },
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

  it("passes the row's button colours through", () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      buttonColor: MOCK_YELLOW_HEX,
      buttonColorDark: MOCK_PINK_HEX,
    });

    expect(result.buttonColor).toBe(MOCK_YELLOW_HEX);
    expect(result.buttonColorDark).toBe(MOCK_PINK_HEX);
  });

  it("keeps the row's preset so the style block can draw its surfaces", () => {
    const result = toThemeTokens({
      ...CONSOLE_ROW,
      preset: PRESET_ID.SHINEFOLD,
    });

    expect(result.preset).toBe(PRESET_ID.SHINEFOLD);
  });
});
