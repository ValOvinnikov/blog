import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';
import { mockSiteConfig } from '@platform/testing/site-config/fixtures';
import { toLookFormValues } from '@platform/utils/to-look-form-values/to-look-form-values';

import {
  defaultLookFormValues,
  lookFormValuesOrDefaults,
} from './default-look-values';

describe(defaultLookFormValues, () => {
  it('follows the Console preset, leaving the logo hue unset', () => {
    const {
      themeTokens,
      cardStyle,
      headerControlStyle,
      headerLayout,
      headerSubmenuStyle,
      headerBarStyle,
      accountButtonStyle,
      accountPanelStyle,
      accountPhonePlacement,
      busyButtonStyle,
      spinnerStyle,
      buttonShape,
      footerLayout,
      footerBackground,
      footerSurface,
      cookieSettingsButton,
    } = PRESET_REGISTRY[PRESET_ID.CONSOLE];

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
      headerLayout,
      headerSubmenuStyle,
      headerBarStyle,
      accountButtonStyle,
      accountPanelStyle,
      accountPhonePlacement,
      busyButtonStyle,
      spinnerStyle,
      buttonShape,
      footerLayout,
      footerBackground,
      footerSurface,
      cookieSettingsButton,
      languageSwitcherStyle: LANGUAGE_SWITCHER_STYLE.MENU_CODE,
      brandName: '',
      logo: { url: undefined },
      favicon: { url: undefined },
    });
  });
});

describe(lookFormValuesOrDefaults, () => {
  it('falls back to the defaults when there is no saved row', () => {
    const values = lookFormValuesOrDefaults(undefined);

    expect(values).toEqual(defaultLookFormValues());
  });

  it('reads the saved row when there is one', () => {
    const siteConfig = mockSiteConfig();
    const values = lookFormValuesOrDefaults(siteConfig);

    expect(values).toEqual(toLookFormValues(siteConfig));
  });
});
