import type { TMaybeUndefined } from '@blog/config';
import type { TSiteConfigResult } from '@blog/db/queries/site-config';
import {
  defaultLookFormValues,
  type TLookFormValues,
} from '@platform/utils/default-look-values/default-look-values';

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
    headerLayout: siteConfig.headerLayout,
    headerSubmenuStyle: siteConfig.headerSubmenuStyle,
    headerBarStyle: siteConfig.headerBarStyle,
    navLinkStyle: siteConfig.navLinkStyle,
    accountButtonStyle: siteConfig.accountButtonStyle,
    accountPanelStyle: siteConfig.accountPanelStyle,
    accountPhonePlacement: siteConfig.accountPhonePlacement,
    busyButtonStyle: siteConfig.busyButtonStyle,
    spinnerStyle: siteConfig.spinnerStyle,
    buttonShape: siteConfig.buttonShape,
    footerLayout: siteConfig.footerLayout,
    footerBackground: siteConfig.footerBackground,
    footerSurface: siteConfig.footerSurface,
    cookieSettingsButton: siteConfig.cookieSettingsButton,
    languageSwitcherStyle: siteConfig.languageSwitcherStyle,
    brandName: siteConfig.brandName ?? '',
    logo: { url: siteConfig.logoAssetUrl },
    favicon: { url: siteConfig.faviconAssetUrl },
  };
};

export const lookFormValuesOrDefaults = (
  siteConfig: TMaybeUndefined<TSiteConfigResult>,
): TLookFormValues =>
  siteConfig ? toLookFormValues(siteConfig) : defaultLookFormValues();
