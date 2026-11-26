import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';
import type { TMaybeUndefined } from '@shinefold/config';
import type { TSiteConfigResult } from '@shinefold/db/queries/site-config';

export const toLookFormValues = (
  siteConfig: TSiteConfigResult,
): TLookFormValues => {
  return {
    preset: siteConfig.preset,
    accentHue: siteConfig.accentHue,
    logoHue: siteConfig.logoHue,
    headingFont: siteConfig.headingFont,
    bodyFont: siteConfig.bodyFont,
    radiusScale: siteConfig.radiusScale,
    density: siteConfig.density,
    cardStyle: siteConfig.cardStyle,
    headerControlStyle: siteConfig.headerControlStyle,
    headerControlShape: siteConfig.headerControlShape,
    headerActionStyle: siteConfig.headerActionStyle,
    headerActionPhonePlacement: siteConfig.headerActionPhonePlacement,
    headerLayout: siteConfig.headerLayout,
    headerSubmenuStyle: siteConfig.headerSubmenuStyle,
    headerBarStyle: siteConfig.headerBarStyle,
    headerBackground: siteConfig.headerBackground,
    breadcrumbBackground: siteConfig.breadcrumbBackground,
    navLinkStyle: siteConfig.navLinkStyle,
    headingWeight: siteConfig.headingWeight,
    headingCase: siteConfig.headingCase,
    imageProportion: siteConfig.imageProportion,
    dividerWidth: siteConfig.dividerWidth,
    colorMode: siteConfig.colorMode,
    accountButtonStyle: siteConfig.accountButtonStyle,
    accountPanelStyle: siteConfig.accountPanelStyle,
    accountPhonePlacement: siteConfig.accountPhonePlacement,
    busyButtonStyle: siteConfig.busyButtonStyle,
    spinnerStyle: siteConfig.spinnerStyle,
    buttonShape: siteConfig.buttonShape,
    buttonColor: siteConfig.buttonColor,
    buttonColorDark: siteConfig.buttonColorDark,
    footerLayout: siteConfig.footerLayout,
    footerBackground: siteConfig.footerBackground,
    footerSurface: siteConfig.footerSurface,
    cookieSettingsButton: siteConfig.cookieSettingsButton,
    languageSwitcherStyle: siteConfig.languageSwitcherStyle,
    brandName: siteConfig.brandName ?? '',
    logo: { url: siteConfig.logoAssetUrl },
    logoDark: { url: siteConfig.logoDarkAssetUrl },
    favicon: { url: siteConfig.faviconAssetUrl },
  };
};

export const lookFormValuesOrDefaults = (
  siteConfig: TMaybeUndefined<TSiteConfigResult>,
): TLookFormValues =>
  siteConfig ? toLookFormValues(siteConfig) : defaultLookFormValues();
