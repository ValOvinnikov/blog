import type { TUpdateLookInput } from '@platform/server/site-config/update-look-input-schema';
import type { TLookFormValues } from '@platform/utils/default-look-values/default-look-values';

export const toUpdateLookInput = (
  values: TLookFormValues,
): TUpdateLookInput => ({
  preset: values.preset,
  accentHue: values.accentHue,
  logoHue: values.logoHue ?? null,
  headingFont: values.headingFont,
  bodyFont: values.bodyFont,
  radiusScale: values.radiusScale,
  density: values.density,
  cardStyle: values.cardStyle,
  headerControlStyle: values.headerControlStyle,
  headerControlShape: values.headerControlShape,
  headerLayout: values.headerLayout,
  headerSubmenuStyle: values.headerSubmenuStyle,
  headerBarStyle: values.headerBarStyle,
  navLinkStyle: values.navLinkStyle,
  accountButtonStyle: values.accountButtonStyle,
  accountPanelStyle: values.accountPanelStyle,
  accountPhonePlacement: values.accountPhonePlacement,
  busyButtonStyle: values.busyButtonStyle,
  spinnerStyle: values.spinnerStyle,
  buttonShape: values.buttonShape,
  footerLayout: values.footerLayout,
  footerBackground: values.footerBackground,
  footerSurface: values.footerSurface,
  cookieSettingsButton: values.cookieSettingsButton,
  languageSwitcherStyle: values.languageSwitcherStyle,
  brandName: values.brandName,
});
