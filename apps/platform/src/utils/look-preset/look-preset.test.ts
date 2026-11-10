import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  COOKIE_SETTINGS_BUTTON,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HUE_MAX,
  HUE_MIN,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config';
import { faker } from '@faker-js/faker';
import {
  MOCK_LOGO_URL,
  MOCK_STAGED_LOGO_BLOB_URL,
} from '@platform/testing/site-config/fixtures';
import { defaultLookFormValues } from '@platform/utils/default-look-values/default-look-values';

import {
  applyPresetDefaults,
  isPresetValue,
  switchPreset,
  withPresetValue,
} from './look-preset';

faker.seed(1);

const MOCK_ACCENT_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });
const MOCK_LOGO_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });
const CONSOLE = PRESET_REGISTRY[PRESET_ID.CONSOLE];
const EDITORIAL = PRESET_REGISTRY[PRESET_ID.EDITORIAL];

describe(applyPresetDefaults, () => {
  it("takes the preset's theme tokens and clears the logo hue", () => {
    const current = {
      ...defaultLookFormValues(),
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
      radiusScale: RADIUS_SCALE.XL,
    };
    const { themeTokens, cardStyle, headerControlStyle, spinnerStyle } =
      PRESET_REGISTRY[PRESET_ID.EDITORIAL];

    expect(applyPresetDefaults(PRESET_ID.EDITORIAL, current)).toMatchObject({
      preset: PRESET_ID.EDITORIAL,
      accentHue: themeTokens.accentHue,
      logoHue: undefined,
      headingFont: themeTokens.headingFont,
      bodyFont: themeTokens.bodyFont,
      radiusScale: themeTokens.radiusScale,
      density: themeTokens.density,
      cardStyle,
      headerControlStyle,
      spinnerStyle,
    });
  });

  it('keeps the footer layout, background, surface and cookie settings button', () => {
    const current = {
      ...defaultLookFormValues(),
      footerLayout: FOOTER_LAYOUT.COMPACT,
      footerBackground: BRAND_VARIANT.PRIMARY,
      footerSurface: FOOTER_SURFACE.CARD,
      cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next).toMatchObject({
      footerLayout: FOOTER_LAYOUT.COMPACT,
      footerBackground: BRAND_VARIANT.PRIMARY,
      footerSurface: FOOTER_SURFACE.CARD,
      cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
    });
  });

  it('keeps the header layout, sub-menus and bar', () => {
    const current = {
      ...defaultLookFormValues(),
      headerLayout: HEADER_LAYOUT.CENTRED_BRAND,
      headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
      headerBarStyle: HEADER_BAR_STYLE.FLOATING,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next).toMatchObject({
      headerLayout: HEADER_LAYOUT.CENTRED_BRAND,
      headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
      headerBarStyle: HEADER_BAR_STYLE.FLOATING,
    });
  });

  it('keeps the account button, panel and phone placement', () => {
    const current = {
      ...defaultLookFormValues(),
      accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
      accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
      accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next).toMatchObject({
      accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
      accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
      accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
    });
  });

  it('keeps the busy button style', () => {
    const current = {
      ...defaultLookFormValues(),
      busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next.busyButtonStyle).toBe(BUSY_BUTTON_STYLE.EDGE);
  });

  it('keeps the language switcher style and both brand images', () => {
    const logo = { url: MOCK_STAGED_LOGO_BLOB_URL };
    const favicon = { url: MOCK_LOGO_URL };
    const current = {
      ...defaultLookFormValues(),
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      logo,
      favicon,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next.languageSwitcherStyle).toBe(LANGUAGE_SWITCHER_STYLE.CODES);
    expect(next.logo).toBe(logo);
    expect(next.favicon).toBe(favicon);
  });
});

describe(switchPreset, () => {
  it('keeps the heading font and radius the owner customised and re-seeds the rest', () => {
    const current = {
      ...defaultLookFormValues(),
      headingFont: FONT_CHOICE.JETBRAINS_MONO,
      radiusScale: RADIUS_SCALE.XL,
    };

    expect(switchPreset(PRESET_ID.EDITORIAL, current)).toMatchObject({
      preset: PRESET_ID.EDITORIAL,
      headingFont: FONT_CHOICE.JETBRAINS_MONO,
      radiusScale: RADIUS_SCALE.XL,
      accentHue: EDITORIAL.themeTokens.accentHue,
      bodyFont: EDITORIAL.themeTokens.bodyFont,
      density: EDITORIAL.themeTokens.density,
      cardStyle: EDITORIAL.cardStyle,
      headerControlStyle: EDITORIAL.headerControlStyle,
      spinnerStyle: EDITORIAL.spinnerStyle,
      buttonShape: EDITORIAL.buttonShape,
    });
  });

  it('keeps a spinner the owner changed', () => {
    const current = {
      ...defaultLookFormValues(),
      spinnerStyle: SPINNER_STYLE.PULSE,
    };

    expect(switchPreset(PRESET_ID.EDITORIAL, current).spinnerStyle).toBe(
      SPINNER_STYLE.PULSE,
    );
  });

  it('keeps a button shape the owner changed', () => {
    const current = {
      ...defaultLookFormValues(),
      buttonShape: BUTTON_SHAPE.PILL,
    };

    expect(switchPreset(PRESET_ID.EDITORIAL, current).buttonShape).toBe(
      BUTTON_SHAPE.PILL,
    );
  });

  it('keeps a customised accent hue', () => {
    const current = {
      ...defaultLookFormValues(),
      accentHue: CONSOLE.themeTokens.accentHue + 1,
    };

    expect(switchPreset(PRESET_ID.EDITORIAL, current).accentHue).toBe(
      CONSOLE.themeTokens.accentHue + 1,
    );
  });

  it('keeps a set logo hue', () => {
    const current = { ...defaultLookFormValues(), logoHue: MOCK_LOGO_HUE };

    expect(switchPreset(PRESET_ID.EDITORIAL, current).logoHue).toBe(
      MOCK_LOGO_HUE,
    );
  });

  it('takes every seeded value of the new preset when nothing was customised', () => {
    const next = switchPreset(PRESET_ID.EDITORIAL, defaultLookFormValues());

    expect(next).toEqual(
      applyPresetDefaults(PRESET_ID.EDITORIAL, defaultLookFormValues()),
    );
  });
});

describe(isPresetValue, () => {
  it("is true while a field holds the current preset's value", () => {
    expect(isPresetValue('headingFont', defaultLookFormValues())).toBe(true);
  });

  it('is false once the field is customised', () => {
    const values = {
      ...defaultLookFormValues(),
      headingFont: FONT_CHOICE.JETBRAINS_MONO,
    };

    expect(isPresetValue('headingFont', values)).toBe(false);
  });
});

describe(withPresetValue, () => {
  it("puts one field back to the current preset's value and leaves the others", () => {
    const current = {
      ...defaultLookFormValues(),
      headingFont: FONT_CHOICE.JETBRAINS_MONO,
      radiusScale: RADIUS_SCALE.XL,
    };

    expect(withPresetValue('headingFont', current)).toEqual({
      ...current,
      headingFont: CONSOLE.themeTokens.headingFont,
    });
  });

  it('resets a customised button shape to the preset value', () => {
    const current = {
      ...defaultLookFormValues(),
      buttonShape: BUTTON_SHAPE.PILL,
    };

    expect(withPresetValue('buttonShape', current).buttonShape).toBe(
      CONSOLE.buttonShape,
    );
  });
});
