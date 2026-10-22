import { PRESET_REGISTRY, type TPresetId } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import { siteConfig } from '@blog/db/schema/site-config';

export async function insertSiteConfigIfMissing(
  tenantId: string,
  preset: TPresetId,
): Promise<void> {
  const { themeTokens, cardStyle, headerControlStyle } =
    PRESET_REGISTRY[preset];

  await getDb()
    .insert(siteConfig)
    .values({
      tenantId,
      preset,
      accentHue: themeTokens.accentHue,
      headingFont: themeTokens.headingFont,
      bodyFont: themeTokens.bodyFont,
      radiusScale: themeTokens.radiusScale,
      density: themeTokens.density,
      cardStyle,
      headerControlStyle,
    })
    .onConflictDoNothing({ target: siteConfig.tenantId });
}
