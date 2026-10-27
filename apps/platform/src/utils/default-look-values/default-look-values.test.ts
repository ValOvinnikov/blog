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
  PRESET_REGISTRY,
  RADIUS_SCALE,
  SPINNER_STYLE,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
import { faker } from '@faker-js/faker';
import {
  MOCK_LOGO_URL,
  MOCK_FAVICON_URL,
} from '@platform/testing/site-config/fixtures';
import { MOCK_TENANT_ID } from '@platform/testing/tenants/fixtures';

import {
  defaultLookFormValues,
  lookFormValuesOrDefaults,
  toLookFormValues,
} from './default-look-values';

faker.seed(6006);

const MOCK_REF_DATE = '2026-10-19T10:00:00.000Z';

const MOCK_SITE_CONFIG: TSiteConfigResult = {
  id: faker.string.uuid(),
  tenantId: MOCK_TENANT_ID,
  preset: PRESET_ID.EDITORIAL,
  accentHue: faker.number.int({ min: 0, max: 360 }),
  logoHue: faker.number.int({ min: 0, max: 360 }),
  headingFont: FONT_CHOICE.FRAUNCES,
  bodyFont: FONT_CHOICE.INTER,
  radiusScale: RADIUS_SCALE.LG,
  density: DENSITY.COMPACT,
  languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
  cardStyle: CARD_STYLE.OUTLINED,
  headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
  accountButtonStyle: ACCOUNT_BUTTON_STYLE.CIRCLE,
  accountPanelStyle: ACCOUNT_PANEL_STYLE.HUB,
  accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.MENU,
  busyButtonStyle: BUSY_BUTTON_STYLE.EDGE,
  spinnerStyle: SPINNER_STYLE.RING,
  headerLayout: HEADER_LAYOUT.TWO_ROWS,
  headerSubmenuStyle: HEADER_SUBMENU_STYLE.WIDE_PANEL,
  headerBarStyle: HEADER_BAR_STYLE.FLOATING,
  logoAssetUrl: MOCK_LOGO_URL,
  faviconAssetUrl: MOCK_FAVICON_URL,
  voiceOverridesByLocale: {},
  voiceOverrides: {},
  createdAt: faker.date.past({ refDate: MOCK_REF_DATE }),
  updatedAt: faker.date.past({ refDate: MOCK_REF_DATE }),
};

describe(defaultLookFormValues, () => {
  it('follows the Console preset, leaving the logo hue unset', () => {
    const { themeTokens, cardStyle, headerControlStyle } =
      PRESET_REGISTRY[PRESET_ID.CONSOLE];

    const values = defaultLookFormValues();

    expect(values).toEqual({
      preset: PRESET_ID.CONSOLE,
      accentHue: themeTokens.accentHue,
      logoHue: undefined,
      headingFont: themeTokens.headingFont,
      bodyFont: themeTokens.bodyFont,
      radiusScale: themeTokens.radiusScale,
      density: themeTokens.density,
      cardStyle,
      headerControlStyle,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      logo: { url: undefined },
      favicon: { url: undefined },
    });
  });
});

describe(toLookFormValues, () => {
  it('carries every stored column through unchanged', () => {
    const values = toLookFormValues(MOCK_SITE_CONFIG);

    expect(values).toEqual({
      preset: MOCK_SITE_CONFIG.preset,
      accentHue: MOCK_SITE_CONFIG.accentHue,
      logoHue: MOCK_SITE_CONFIG.logoHue,
      headingFont: MOCK_SITE_CONFIG.headingFont,
      bodyFont: MOCK_SITE_CONFIG.bodyFont,
      radiusScale: MOCK_SITE_CONFIG.radiusScale,
      density: MOCK_SITE_CONFIG.density,
      languageSwitcherStyle: MOCK_SITE_CONFIG.languageSwitcherStyle,
      cardStyle: MOCK_SITE_CONFIG.cardStyle,
      headerControlStyle: MOCK_SITE_CONFIG.headerControlStyle,
      logo: { url: MOCK_LOGO_URL },
      favicon: { url: MOCK_FAVICON_URL },
    });
  });
});

describe(lookFormValuesOrDefaults, () => {
  it('falls back to the defaults when there is no saved row', () => {
    const values = lookFormValuesOrDefaults(undefined);

    expect(values).toEqual(defaultLookFormValues());
  });

  it('reads the saved row when there is one', () => {
    const values = lookFormValuesOrDefaults(MOCK_SITE_CONFIG);

    expect(values).toEqual(toLookFormValues(MOCK_SITE_CONFIG));
  });
});
