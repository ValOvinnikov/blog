import { PLAN_REGISTRY } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';
import { FeaturesSettings } from '@platform/components/features/capabilities/features-settings';
import { getSettingsFeaturesOrDefaults } from '@platform/server/settings-features/settings-features-or-defaults';
import { updateFeaturesAction } from '@platform/server/settings-features/update-features-action';
import { clampToEntitlement } from '@platform/utils/settings-features-fields/settings-features-fields';

export type TFeaturesPageContentProps = {
  tenant: TTenant;
};

/**
 * The Features tab's data-fetch + render, shared by
 * `/tenants/[tenantId]/features` and `/dashboard/features` — both resolve a
 * `TTenant` however fits their own routing and hand it here.
 */
export const FeaturesPageContent = async ({
  tenant,
}: TFeaturesPageContentProps) => {
  const entitledCapabilities = PLAN_REGISTRY[tenant.plan];
  const rawInitialValues = await getSettingsFeaturesOrDefaults(tenant.id);
  // A plan downgrade can leave a stale `true` for a now-unentitled
  // capability in the saved row — clamp it before the form ever renders it.
  const initialValues = clampToEntitlement(
    rawInitialValues,
    entitledCapabilities,
  );

  return (
    <FeaturesSettings
      tenantId={tenant.id}
      entitledCapabilities={entitledCapabilities}
      initialValues={initialValues}
      saveAction={updateFeaturesAction}
      archivedAt={tenant.deprovisionedAt ?? undefined}
    />
  );
};
