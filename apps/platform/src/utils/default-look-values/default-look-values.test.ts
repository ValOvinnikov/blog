import {
  ACCOUNT_BUTTON_STYLE,
  ACCOUNT_PANEL_STYLE,
  ACCOUNT_PHONE_PLACEMENT,
  CARD_STYLE,
  DENSITY,
  FONT_CHOICE,
  HEADER_CONTROL_STYLE,
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  RADIUS_SCALE,
} from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
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

describe(defaultLookFormValues, () => {
  it('matches the Console preset registry defaults, with logo hue following accent', () => {
    expect(defaultLookFormValues()).toEqual({
      preset: PRESET_ID.CONSOLE,
      accentHue: 250,
      logoHue: undefined,
      headingFont: FONT_CHOICE.SPACE_GROTESK,
      bodyFont: FONT_CHOICE.NEWSREADER,
      radiusScale: RADIUS_SCALE.MD,
      density: DENSITY.DEFAULT,
      cardStyle: CARD_STYLE.ACCENT_BAR,
      headerControlStyle: HEADER_CONTROL_STYLE.OUTLINED,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      logo: { url: undefined },
      favicon: { url: undefined },
    });
  });
});

describe(toLookFormValues, () => {
  it('carries every stored column through unchanged', () => {
    const siteConfig: TSiteConfigResult = {
      id: 'config-1',
      tenantId: MOCK_TENANT_ID,
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      logoHue: 90,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      cardStyle: CARD_STYLE.OUTLINED,
      headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
      accountButtonStyle: ACCOUNT_BUTTON_STYLE.PILL,
      accountPanelStyle: ACCOUNT_PANEL_STYLE.CARD,
      accountPhonePlacement: ACCOUNT_PHONE_PLACEMENT.BAR,
      logoAssetUrl: MOCK_LOGO_URL,
      faviconAssetUrl: MOCK_FAVICON_URL,
      voiceOverridesByLocale: {},
      voiceOverrides: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    expect(toLookFormValues(siteConfig)).toEqual({
      preset: PRESET_ID.EDITORIAL,
      accentHue: 40,
      logoHue: 90,
      headingFont: FONT_CHOICE.FRAUNCES,
      bodyFont: FONT_CHOICE.INTER,
      radiusScale: RADIUS_SCALE.LG,
      density: DENSITY.COMPACT,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.CODES,
      cardStyle: CARD_STYLE.OUTLINED,
      headerControlStyle: HEADER_CONTROL_STYLE.SOFT,
      logo: { url: MOCK_LOGO_URL },
      favicon: { url: MOCK_FAVICON_URL },
    });
  });
});

describe(lookFormValuesOrDefaults, () => {
  it('falls back to the defaults when there is no saved row', () => {
    expect(lookFormValuesOrDefaults(undefined)).toEqual(
      defaultLookFormValues(),
    );
  });
});
