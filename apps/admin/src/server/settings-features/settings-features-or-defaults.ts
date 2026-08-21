import 'server-only';

import { getSiteConfigOrDefaults } from '@admin/server/site-config/site-config-or-defaults';
import {
  featureDefaultsToValues,
  type TSettingsFeaturesValues,
} from '@admin/utils/settings-features-fields/settings-features-fields';
import { PRESET_REGISTRY } from '@blog/config';
import { queries } from '@blog/db';

/**
 * `settings_features` follows `site_config`'s own lazy-default pattern —
 * nothing seeds a row at tenant-provisioning time. When one is absent, this
 * falls back to the tenant's *current* `site_config.preset`'s
 * `PRESET_REGISTRY[preset].featureDefaults`, so a later preset change is
 * reflected even though no `settings_features` row exists yet to update.
 */
export const getSettingsFeaturesOrDefaults = async (
  tenantId: string,
): Promise<TSettingsFeaturesValues> => {
  const row = await queries.settingsFeatures.getSettingsFeatures(tenantId);
  if (row) {
    return {
      commentsEnabled: row.commentsEnabled,
      ratingsEnabled: row.ratingsEnabled,
      bookmarksEnabled: row.bookmarksEnabled,
      newsletterEnabled: row.newsletterEnabled,
      analyticsEnabled: row.analyticsEnabled,
    };
  }

  const { preset } = await getSiteConfigOrDefaults(tenantId);
  return featureDefaultsToValues(PRESET_REGISTRY[preset].featureDefaults);
};
