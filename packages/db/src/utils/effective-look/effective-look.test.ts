import { faker } from '@faker-js/faker';
import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BRAND_VARIANT,
  BUSY_BUTTON_STYLE,
  BUTTON_SHAPE,
  CARD_STYLE,
  COOKIE_SETTINGS_BUTTON,
  DENSITY,
  DIVIDER_WIDTH,
  FONT_CHOICE,
  FOOTER_LAYOUT,
  FOOTER_SURFACE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_SHAPE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  HEADING_CASE,
  HEADING_WEIGHT,
  IMAGE_PROPORTION,
  LANGUAGE_SWITCHER_STYLE,
  NAV_LINK_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
  TENANT_PLAN,
} from '@shinefold/config/constants';
import { LOOK_FIELD, PLAN_ENTITLEMENTS } from '@shinefold/db/constants';
import { MOCK_ACCENT_HUE } from '@shinefold/db/testing/site-config/fixtures';

import {
  isLookFieldWithin,
  pickLookWithin,
  toEffectiveLookWithin,
  type TLook,
} from './effective-look';

faker.seed(5052);

const MOCK_LOGO_HUE = MOCK_ACCENT_HUE - 1;
const MOCK_BRAND_NAME = faker.company.name();
const MOCK_LOGO_ASSET_URL = faker.internet.url();
const MOCK_FAVICON_ASSET_URL = faker.internet.url();

const STORED_LOOK: TLook = {
  preset: PRESET_ID.EDITORIAL,
  accentHue: MOCK_ACCENT_HUE,
  logoHue: MOCK_LOGO_HUE,
  headingFont: FONT_CHOICE.SPACE_GROTESK,
  bodyFont: FONT_CHOICE.NEWSREADER,
  radiusScale: RADIUS_SCALE.XL,
  density: DENSITY.DEFAULT,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  cardStyle: CARD_STYLE.ACCENT_BAR,
  headerControlStyle: HEADER_CONTROL_STYLE.PLAIN,
  headerControlShape: HEADER_CONTROL_SHAPE.SQUARE,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
  busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
  spinnerStyle: SPINNER_STYLE.BRAILLE,
  buttonShape: BUTTON_SHAPE.PILL,
  headerLayout: HEADER_LAYOUT.TWO_ROWS,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  headerBarStyle: HEADER_BAR_STYLE.FLOATING,
  navLinkStyle: NAV_LINK_STYLE.PILL,
  headingWeight: HEADING_WEIGHT.BOLD,
  headingCase: HEADING_CASE.UPPERCASE,
  imageProportion: IMAGE_PROPORTION.SQUARE,
  dividerWidth: DIVIDER_WIDTH.BOLD,
  footerLayout: FOOTER_LAYOUT.COMPACT,
  footerBackground: BRAND_VARIANT.SECONDARY,
  footerSurface: FOOTER_SURFACE.CARD,
  cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
  brandName: MOCK_BRAND_NAME,
  logoAssetUrl: MOCK_LOGO_ASSET_URL,
  faviconAssetUrl: MOCK_FAVICON_ASSET_URL,
};

const GROWTH = PLAN_ENTITLEMENTS[TENANT_PLAN.GROWTH];
const FREE = PLAN_ENTITLEMENTS[TENANT_PLAN.FREE];
const MOCK_ENTITLEMENTS_LABEL = 'a heading-font grant';
const MOCK_ENTITLEMENTS = {
  lookFields: [LOOK_FIELD.PRESET, LOOK_FIELD.HEADING_FONT],
};

describe(toEffectiveLookWithin, () => {
  it('returns every stored value on Growth', () => {
    expect(toEffectiveLookWithin(STORED_LOOK, GROWTH)).toEqual(STORED_LOOK);
  });

  it("replaces every Growth-only value with the preset's on Free", () => {
    expect(toEffectiveLookWithin(STORED_LOOK, FREE)).toEqual({
      preset: PRESET_ID.EDITORIAL,
      accentHue: MOCK_ACCENT_HUE,
      logoHue: undefined,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.SM,
      density: DENSITY.COMPACT,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      cardStyle: CARD_STYLE.OUTLINED,
      headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
      headerControlShape: HEADER_CONTROL_SHAPE.ROUND,
      accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
      accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
      accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
      busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
      spinnerStyle: SPINNER_STYLE.RING,
      buttonShape: BUTTON_SHAPE.ROUNDED,
      headerLayout: HEADER_LAYOUT.CLASSIC,
      headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
      headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
      navLinkStyle: NAV_LINK_STYLE.PLAIN,
      headingWeight: HEADING_WEIGHT.MEDIUM,
      headingCase: HEADING_CASE.AS_WRITTEN,
      imageProportion: IMAGE_PROPORTION.AS_DESIGNED,
      dividerWidth: DIVIDER_WIDTH.HAIRLINE,
      footerLayout: FOOTER_LAYOUT.COLUMNS,
      footerBackground: BRAND_VARIANT.BRAND_PRIMARY,
      footerSurface: FOOTER_SURFACE.FULL_WIDTH,
      cookieSettingsButton: COOKIE_SETTINGS_BUTTON.SHOWN,
      brandName: MOCK_BRAND_NAME,
      logoAssetUrl: MOCK_LOGO_ASSET_URL,
      faviconAssetUrl: MOCK_FAVICON_ASSET_URL,
    });
  });

  it('leaves keys outside the Look untouched and adds no missing Look keys', () => {
    const { preset, headingFont } = STORED_LOOK;
    const extra = faker.lorem.word();

    expect(toEffectiveLookWithin({ preset, headingFont, extra }, FREE)).toEqual(
      { preset, headingFont: FONT_CHOICE.FRAUNCES, extra },
    );
  });

  it('keeps a granted stored value and replaces the rest', () => {
    const { preset, headingFont, bodyFont } = STORED_LOOK;

    expect(
      toEffectiveLookWithin(
        { preset, headingFont, bodyFont },
        MOCK_ENTITLEMENTS,
      ),
    ).toEqual({ preset, headingFont, bodyFont: FONT_CHOICE.INTER });
  });
});

describe(isLookFieldWithin, () => {
  it.each([
    [LOOK_FIELD.PRESET, TENANT_PLAN.FREE, FREE, true],
    [LOOK_FIELD.LOGO_ASSET_URL, TENANT_PLAN.FREE, FREE, true],
    [LOOK_FIELD.BRAND_NAME, TENANT_PLAN.FREE, FREE, true],
    [LOOK_FIELD.HEADING_FONT, TENANT_PLAN.FREE, FREE, false],
    [LOOK_FIELD.COOKIE_SETTINGS_BUTTON, TENANT_PLAN.FREE, FREE, true],
    [LOOK_FIELD.FOOTER_LAYOUT, TENANT_PLAN.FREE, FREE, false],
    [LOOK_FIELD.HEADER_CONTROL_SHAPE, TENANT_PLAN.FREE, FREE, false],
    [LOOK_FIELD.HEADING_FONT, TENANT_PLAN.GROWTH, GROWTH, true],
    [LOOK_FIELD.HEADING_FONT, MOCK_ENTITLEMENTS_LABEL, MOCK_ENTITLEMENTS, true],
    [LOOK_FIELD.BODY_FONT, MOCK_ENTITLEMENTS_LABEL, MOCK_ENTITLEMENTS, false],
  ] as const)(
    'reports %s within %s as %s',
    (field, _, entitlements, expected) => {
      expect(isLookFieldWithin(field, entitlements)).toBe(expected);
    },
  );
});

describe(pickLookWithin, () => {
  it('drops every field the plan does not include', () => {
    const { preset, accentHue, headingFont, logoHue } = STORED_LOOK;

    expect(
      pickLookWithin({ preset, accentHue, headingFont, logoHue }, FREE),
    ).toEqual({ preset, accentHue });
  });

  it('picks only the granted fields', () => {
    const { preset, headingFont, bodyFont } = STORED_LOOK;

    expect(
      pickLookWithin({ preset, headingFont, bodyFont }, MOCK_ENTITLEMENTS),
    ).toEqual({ preset, headingFont });
  });
});
