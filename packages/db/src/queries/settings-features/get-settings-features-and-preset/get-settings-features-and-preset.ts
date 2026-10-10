import type { TPresetId } from '@blog/config/constants';
import { getDb } from '@blog/db/client';
import {
  settingsFeatures,
  type TSettingsFeatures,
} from '@blog/db/schema/settings-features';
import { siteConfig } from '@blog/db/schema/site-config';
import { tenants } from '@blog/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TSettingsFeatureToggles = Pick<
  TSettingsFeatures,
  | 'commentsEnabled'
  | 'ratingsEnabled'
  | 'bookmarksEnabled'
  | 'newsletterEnabled'
  | 'analyticsEnabled'
  | 'consentBannerEnabled'
>;

export type TSettingsFeaturesAndPreset = {
  features: TSettingsFeatureToggles | undefined;
  preset: TPresetId | undefined;
};

export async function getSettingsFeaturesAndPreset(
  tenantId: string,
): Promise<TSettingsFeaturesAndPreset> {
  const [row] = await getDb()
    .select({
      features: {
        commentsEnabled: settingsFeatures.commentsEnabled,
        ratingsEnabled: settingsFeatures.ratingsEnabled,
        bookmarksEnabled: settingsFeatures.bookmarksEnabled,
        newsletterEnabled: settingsFeatures.newsletterEnabled,
        analyticsEnabled: settingsFeatures.analyticsEnabled,
        consentBannerEnabled: settingsFeatures.consentBannerEnabled,
      },
      preset: siteConfig.preset,
    })
    .from(tenants)
    .leftJoin(settingsFeatures, eq(settingsFeatures.tenantId, tenants.id))
    .leftJoin(siteConfig, eq(siteConfig.tenantId, tenants.id))
    .where(eq(tenants.id, tenantId));

  return {
    features: row?.features ?? undefined,
    preset: row?.preset ?? undefined,
  };
}
