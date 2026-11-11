import {
  LANGUAGE_SWITCHER_STYLE,
  PRESET_ID,
  PRESET_REGISTRY,
} from '@blog/config';

import { defaultLookFormValues } from './default-look-values';

describe(defaultLookFormValues, () => {
  it('follows the Console preset, leaving the logo hue unset', () => {
    const {
      themeTokens,
      cardStyle,
      headerControlStyle,
      headerControlShape,
      headerLayout,
      headerSubmenuStyle,
      headerBarStyle,
      navLinkStyle,
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
      headerControlShape,
      headerLayout,
      headerSubmenuStyle,
      headerBarStyle,
      navLinkStyle,
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
