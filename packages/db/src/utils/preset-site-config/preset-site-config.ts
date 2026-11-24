import {
  PRESET_REGISTRY,
  type TPresetBundle,
  type TPresetId,
  type TThemeTokens,
} from '@shinefold/config/constants';

type TPresetSiteConfig = { preset: TPresetId } & Pick<
  TThemeTokens,
  'accentHue' | 'headingFont' | 'bodyFont' | 'radiusScale' | 'density'
> &
  Omit<TPresetBundle, 'themeTokens' | 'featureDefaults'>;

export function presetSiteConfig(preset: TPresetId): TPresetSiteConfig {
  const {
    themeTokens: { accentHue, headingFont, bodyFont, radiusScale, density },
    cardStyle,
    headerControlStyle,
    headerControlShape,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    buttonShape,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    headerBackground,
    breadcrumbBackground,
    navLinkStyle,
    headingWeight,
    headingCase,
    imageProportion,
    dividerWidth,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
  } = PRESET_REGISTRY[preset];

  return {
    preset,
    accentHue,
    headingFont,
    bodyFont,
    radiusScale,
    density,
    cardStyle,
    headerControlStyle,
    headerControlShape,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    buttonShape,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
    headerBackground,
    breadcrumbBackground,
    navLinkStyle,
    headingWeight,
    headingCase,
    imageProportion,
    dividerWidth,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
  };
}
