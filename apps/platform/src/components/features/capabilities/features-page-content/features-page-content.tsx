import { FeaturesSettings } from '@platform/components/features/capabilities/features-settings';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import {
  toAnalyticsDraft,
  withConsentBannerForGoogleAnalytics,
} from '@platform/utils/analytics-draft/analytics-draft';
import type { TPlatformTenant } from '@platform/utils/platform-tenant/platform-tenant';
import {
  clampToEntitlement,
  withComingSoonOff,
} from '@platform/utils/settings-features-fields/settings-features-fields';
import { queries } from '@shinefold/db';

export type TFeaturesPageContentProps = {
  tenant: TPlatformTenant;
};

export const FeaturesPageContent = async ({
  tenant,
}: TFeaturesPageContentProps) => {
  const { id, entitlements, archivedAt } = tenant;
  const entitledCapabilities = entitlements.capabilities;
  const [{ values, savedAt }, storedAnalytics] = await Promise.all([
    getSettingsFeaturesOrDefaults(id),
    queries.tenantAnalytics.getStoredTenantAnalytics(id),
  ]);
  const storedValues = {
    ...withComingSoonOff(clampToEntitlement(values, entitledCapabilities)),
    ...toAnalyticsDraft(storedAnalytics),
  };
  const initialValues = entitlements.hasOwnAnalytics
    ? withConsentBannerForGoogleAnalytics(storedValues)
    : storedValues;

  return (
    <FeaturesSettings
      tenantId={id}
      entitledCapabilities={entitledCapabilities}
      hasOwnAnalytics={entitlements.hasOwnAnalytics}
      initialValues={initialValues}
      savedAt={savedAt}
      archivedAt={archivedAt}
    />
  );
};
