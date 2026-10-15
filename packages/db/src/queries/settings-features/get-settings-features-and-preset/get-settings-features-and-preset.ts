import type { TPresetId } from '@blog/config/constants';
import type { TMaybeUndefined } from '@blog/config/types';
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
  | 'contactFormEnabled'
>;

export type TSettingsFeaturesAndPreset = {
  features: TMaybeUndefined<TSettingsFeatureToggles>;
  updatedAt: TMaybeUndefined<Date>;
  preset: TMaybeUndefined<TPresetId>;
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
        contactFormEnabled: settingsFeatures.contactFormEnabled,
      },
      updatedAt: settingsFeatures.updatedAt,
      preset: siteConfig.preset,
    })
    .from(tenants)
    .leftJoin(settingsFeatures, eq(settingsFeatures.tenantId, tenants.id))
    .leftJoin(siteConfig, eq(siteConfig.tenantId, tenants.id))
    .where(eq(tenants.id, tenantId));

  return {
    features: row?.features ?? undefined,
    updatedAt: row?.updatedAt ?? undefined,
    preset: row?.preset ?? undefined,
  };
}
