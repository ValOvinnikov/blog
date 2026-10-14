import { PLAN_REGISTRY } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { FeaturesSettings } from '@platform/components/features/capabilities/features-settings';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import {
  clampToEntitlement,
  withComingSoonOff,
} from '@platform/utils/settings-features-fields/settings-features-fields';

export type TFeaturesPageContentProps = {
  tenant: TTenant;
};

export const FeaturesPageContent = async ({
  tenant,
}: TFeaturesPageContentProps) => {
  const entitledCapabilities = PLAN_REGISTRY[tenant.plan];
  const rawInitialValues = await getSettingsFeaturesOrDefaults(tenant.id);
  // A plan downgrade can leave a stale `true` for a now-unentitled
  // capability in the saved row — clamp it before the form ever renders it.
  const initialValues = withComingSoonOff(
    clampToEntitlement(rawInitialValues, entitledCapabilities),
  );

  return (
    <FeaturesSettings
      tenantId={tenant.id}
      entitledCapabilities={entitledCapabilities}
      initialValues={initialValues}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};
