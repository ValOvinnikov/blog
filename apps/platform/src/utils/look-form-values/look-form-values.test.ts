import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  COOKIE_SETTINGS_BUTTON,
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
  countChanges,
  isFieldChanged,
  listLostStagedFiles,
} from './look-form-values';

faker.seed(1);

const MOCK_LOGO_FILE = new File([faker.lorem.word()], faker.system.fileName(), {
  type: 'image/png',
});
const MOCK_STAGED_FAVICON_URL = faker.internet.url();
const MOCK_ACCENT_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });
const MOCK_LOGO_HUE = faker.number.int({ min: HUE_MIN, max: HUE_MAX });

describe(applyPresetDefaults, () => {
  it("takes the preset's theme tokens and clears the logo hue", () => {
    const current = {
      ...defaultLookFormValues(),
      accentHue: MOCK_ACCENT_HUE,
      logoHue: MOCK_LOGO_HUE,
      radiusScale: RADIUS_SCALE.XL,
    };
    const { themeTokens, cardStyle, headerControlStyle } =
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

  it('keeps the busy button style and spinner', () => {
    const current = {
      ...defaultLookFormValues(),
      busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
      spinnerStyle: SPINNER_STYLE.PULSE,
    };

    const next = applyPresetDefaults(PRESET_ID.EDITORIAL, current);

    expect(next).toMatchObject({
      busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
      spinnerStyle: SPINNER_STYLE.PULSE,
    });
  });

  it('keeps the language switcher style and both brand images', () => {
    const logo = { url: MOCK_STAGED_LOGO_BLOB_URL, file: MOCK_LOGO_FILE };
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

describe(isFieldChanged, () => {
  it('treats an equal plain field as unchanged', () => {
    const a = defaultLookFormValues();

    expect(isFieldChanged('accentHue', a, { ...a })).toBe(false);
  });

  it('treats a different plain field as changed', () => {
    const a = defaultLookFormValues();
    const b = { ...a, accentHue: a.accentHue + 1 };

    expect(isFieldChanged('accentHue', a, b)).toBe(true);
  });

  it('treats a brand image with the same url and file as unchanged', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL } };

    expect(isFieldChanged('logo', a, b)).toBe(false);
  });

  it('treats a newly staged file as a change', () => {
    const a = { ...defaultLookFormValues(), logo: { url: MOCK_LOGO_URL } };
    const b = { ...a, logo: { url: MOCK_LOGO_URL, file: MOCK_LOGO_FILE } };

    expect(isFieldChanged('logo', a, b)).toBe(true);
  });
});

describe(countChanges, () => {
  it('counts nothing between equal values', () => {
    const a = defaultLookFormValues();

    expect(countChanges(a, defaultLookFormValues())).toBe(0);
  });

  it('counts each changed field once, brand images included', () => {
    const a = defaultLookFormValues();
    const b = {
      ...a,
      accentHue: a.accentHue + 1,
      radiusScale: RADIUS_SCALE.XL,
      favicon: { url: MOCK_STAGED_FAVICON_URL, file: MOCK_LOGO_FILE },
    };

    expect(countChanges(a, b)).toBe(3);
  });
});

describe(listLostStagedFiles, () => {
  it('lists every brand image that was staged as a file', () => {
    const draft = {
      ...defaultLookFormValues(),
      logo: { url: MOCK_STAGED_LOGO_BLOB_URL, file: {} as File },
      favicon: { url: MOCK_LOGO_URL },
    };

    expect(listLostStagedFiles(draft)).toEqual(['logo']);
  });

  it('lists nothing when no file was staged', () => {
    expect(listLostStagedFiles(defaultLookFormValues())).toEqual([]);
  });
});
