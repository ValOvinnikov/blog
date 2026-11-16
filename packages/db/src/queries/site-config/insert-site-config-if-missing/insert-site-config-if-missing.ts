import type { TPresetId } from '@shinefold/config/constants';
import { getDb } from '@shinefold/db/client';
import { siteConfig } from '@shinefold/db/schema/site-config';
import { presetSiteConfig } from '@shinefold/db/utils/preset-site-config/preset-site-config';

export async function insertSiteConfigIfMissing(
  tenantId: string,
  preset: TPresetId,
  accentHue?: number,
): Promise<void> {
  const presetValues = presetSiteConfig(preset);

  await getDb()
    .insert(siteConfig)
    .values({
      tenantId,
      ...presetValues,
      accentHue: accentHue ?? presetValues.accentHue,
    })
    .onConflictDoNothing({ target: siteConfig.tenantId });
}
