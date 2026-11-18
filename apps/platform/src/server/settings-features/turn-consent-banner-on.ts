import 'server-only';

import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { queries } from '@shinefold/db';

export const turnConsentBannerOn = async (tenantId: string): Promise<void> => {
  const { values } = await getSettingsFeaturesOrDefaults(tenantId);
  if (values.consentBannerEnabled) return;

  await queries.settingsFeatures.upsertSettingsFeatures(tenantId, {
    ...values,
    consentBannerEnabled: true,
  });
};
