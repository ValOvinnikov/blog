import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

export interface IFeatureHighlightsModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const FeatureHighlightsModule = async ({
  id,
  tenant,
}: IFeatureHighlightsModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result =
    await service.modules.featureHighlights.v1.getFeatureHighlightsModule(
      id,
      tenantContext,
    );

  if (!result.ok) {
    logger.error('feature_highlights_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }
  const { highlights, ...view } = result.data;
  if (highlights.length === 0) return null;

  return (
    <FeatureHighlightsModuleView
      {...view}
      highlights={highlights}
      titleId={`feature-highlights-${id}`}
      dataTestId={`feature-highlights-module-${id}`}
    />
  );
};
