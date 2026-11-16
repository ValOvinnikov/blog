import type { TPresetId } from '@shinefold/config/constants';
import type { TMaybeUndefined } from '@shinefold/config/types';
import { getDb } from '@shinefold/db/client';
import {
  settingsFeatures,
  type TSettingsFeatures,
} from '@shinefold/db/schema/settings-features';
import { siteConfig } from '@shinefold/db/schema/site-config';
import { tenants } from '@shinefold/db/schema/tenants';
import { eq } from 'drizzle-orm';

export type TSettingsFeatureToggles = Pick<
  TSettingsFeatures,
  | 'readerAccountsEnabled'
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
        readerAccountsEnabled: settingsFeatures.readerAccountsEnabled,
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
