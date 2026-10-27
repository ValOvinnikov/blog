import { PRESET_REGISTRY, type TPresetId } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { siteConfig } from '@blog/db/schema/site-config';

export async function insertSiteConfigIfMissing(
  tenantId: string,
  preset: TPresetId,
  accentHue?: number,
): Promise<void> {
  const {
    themeTokens,
    cardStyle,
    headerControlStyle,
    accountButtonStyle,
    accountPanelStyle,
    accountPhonePlacement,
    busyButtonStyle,
    spinnerStyle,
    headerLayout,
    headerSubmenuStyle,
    headerBarStyle,
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
      accountButtonStyle,
      accountPanelStyle,
      accountPhonePlacement,
      busyButtonStyle,
      spinnerStyle,
      headerLayout,
      headerSubmenuStyle,
      headerBarStyle,
    })
    .onConflictDoNothing({ target: siteConfig.tenantId });
}
