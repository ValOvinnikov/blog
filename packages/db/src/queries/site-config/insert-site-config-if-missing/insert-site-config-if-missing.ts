import { PRESET_REGISTRY, type TPresetId } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { siteConfig } from '@shinefold/db/schema/site-config';

export async function insertSiteConfigIfMissing(
  tenantId: string,
  preset: TPresetId,
  accentHue?: number,
): Promise<void> {
  const {
    themeTokens,
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
    navLinkStyle,
    footerLayout,
    footerBackground,
    footerSurface,
    cookieSettingsButton,
  } = PRESET_REGISTRY[preset];

  await getDb()
    .insert(siteConfig)
    .values({
      tenantId,
      preset,
      accentHue: accentHue ?? themeTokens.accentHue,
      headingFont: themeTokens.headingFont,
      bodyFont: themeTokens.bodyFont,
      radiusScale: themeTokens.radiusScale,
      density: themeTokens.density,
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
      navLinkStyle,
      footerLayout,
      footerBackground,
      footerSurface,
      cookieSettingsButton,
    })
    .onConflictDoNothing({ target: siteConfig.tenantId });
}
