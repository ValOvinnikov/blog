import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';

import { FeatureListModuleView } from './feature-list-module-view';

export interface IFeatureListModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

/**
 * FeatureListModule — fetches `module_featureList` data and hands it to
 * `FeatureListModuleView`. Renders nothing when the fetch fails, or when the
 * authored cards degrade to an empty list (fewer than the schema's two-card
 * minimum).
 */
export const FeatureListModule = async ({
  id,
  tenant,
}: IFeatureListModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.featureList.v1.getFeatureList(
    id,
    tenantContext,
  );

  if (!result.ok) return null;
  if (result.data.items.length === 0) return null;

  return (
    <FeatureListModuleView
      {...result.data}
      titleId={`feature-list-${id}`}
      dataTestId={`feature-list-module-${id}`}
    />
  );
};
