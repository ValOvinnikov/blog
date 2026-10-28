import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  BUSY_BUTTON_STYLE,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_BAR_STYLE,
  HEADER_CONTROL_STYLE,
  HEADER_LAYOUT,
  HEADER_SUBMENU_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config/constants';
import { TENANT_PLAN } from '@blog/db/constants';
import { MOCK_ACCENT_HUE } from '@blog/db/testing/site-config/fixtures';
import { faker } from '@faker-js/faker';

import {
  isLookFieldEntitled,
  pickEntitledLook,
  toEffectiveLook,
  type TLook,
} from './effective-look';

faker.seed(5052);

const MOCK_LOGO_HUE = MOCK_ACCENT_HUE - 1;
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
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
  busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
  spinnerStyle: SPINNER_STYLE.BRAILLE,
  headerLayout: HEADER_LAYOUT.TWO_ROWS,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  headerBarStyle: HEADER_BAR_STYLE.FLOATING,
  logoAssetUrl: MOCK_LOGO_ASSET_URL,
  faviconAssetUrl: MOCK_FAVICON_ASSET_URL,
};

describe(toEffectiveLook, () => {
  it('returns every stored value on Growth', () => {
    expect(toEffectiveLook(STORED_LOOK, TENANT_PLAN.GROWTH)).toEqual(
      STORED_LOOK,
    );
  });

  it("replaces every Growth-only value with the preset's on Free", () => {
    expect(toEffectiveLook(STORED_LOOK, TENANT_PLAN.FREE)).toEqual({
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
      accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
      accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
      accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
      busyButtonStyle: BUSY_BUTTON_STYLE.LABEL,
      spinnerStyle: SPINNER_STYLE.PRESET,
      headerLayout: HEADER_LAYOUT.CLASSIC,
      headerSubmenuStyle: HEADER_SUBMENU_STYLE.DROPDOWN,
      headerBarStyle: HEADER_BAR_STYLE.FULL_WIDTH,
      logoAssetUrl: MOCK_LOGO_ASSET_URL,
      faviconAssetUrl: MOCK_FAVICON_ASSET_URL,
    });
  });

  it('leaves keys outside the Look untouched and adds no missing Look keys', () => {
    const { preset, headingFont } = STORED_LOOK;
    const extra = faker.lorem.word();

    expect(
      toEffectiveLook({ preset, headingFont, extra }, TENANT_PLAN.FREE),
    ).toEqual({ preset, headingFont: FONT_CHOICE.FRAUNCES, extra });
  });
});

describe(isLookFieldEntitled, () => {
  it.each([
    ['preset', TENANT_PLAN.FREE, true],
    ['logoAssetUrl', TENANT_PLAN.FREE, true],
    ['headingFont', TENANT_PLAN.FREE, false],
    ['headingFont', TENANT_PLAN.GROWTH, true],
  ] as const)('reports %s on %s as %s', (field, plan, expected) => {
    expect(isLookFieldEntitled(field, plan)).toBe(expected);
  });
});

describe(pickEntitledLook, () => {
  it('drops every field the plan does not include', () => {
    const { preset, accentHue, headingFont, logoHue } = STORED_LOOK;

    expect(
      pickEntitledLook(
        { preset, accentHue, headingFont, logoHue },
        TENANT_PLAN.FREE,
      ),
    ).toEqual({ preset, accentHue });
  });
});
