import { FeaturesSettings } from '@admin/components/features-settings';
import { getSettingsFeaturesOrDefaults } from '@admin/server/settings-features/settings-features-or-defaults';
import { updateFeaturesAction } from '@admin/server/settings-features/update-features-action';
import { PLAN_REGISTRY } from '@blog/db/constants';
import type { TTenant } from '@blog/db/schema/tenants';

export type TFeaturesPageContentProps = {
  tenant: TTenant;
};

/**
 * The Features tab's data-fetch + render, shared by `/t/[tenantSlug]/features`
 * and the slug-free `/dashboard/features` — both resolve a `TTenant` however
 * fits their own routing and hand it here.
 */
export const FeaturesPageContent = async ({
  tenant,
}: TFeaturesPageContentProps) => {
  const initialValues = await getSettingsFeaturesOrDefaults(tenant.id);

  return (
    <FeaturesSettings
      tenantSlug={tenant.slug}
      entitledCapabilities={PLAN_REGISTRY[tenant.plan]}
      initialValues={initialValues}
      saveAction={updateFeaturesAction}
    />
  );
};
