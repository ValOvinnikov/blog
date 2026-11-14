import { service } from '@blog/service';
import { FEATURE_LIST_LOG } from '@web/constants/feature-list';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getSectionAppearance } from '@web/server/site-config/get-section-appearance/get-section-appearance';
import { logger } from '@web/utils/logger/logger';

import { FeatureListModuleView } from './feature-list-module-view';

export interface IFeatureListModuleProps {
  id: string;
}

export const FeatureListModule = async ({ id }: IFeatureListModuleProps) => {
  const { sanityContext, tenantId } = await getRequestContext();
  const result = await service.modules.featureList.v1.getFeatureList(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(FEATURE_LIST_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }

  const {
    brandVariant,
    layout,
    cardStyle,
    radiusScale,
    density,
    ...featureListModule
  } = result.data;
  const appearance = await getSectionAppearance(tenantId, {
    cardStyle,
    radiusScale,
    density,
  });

  return (
    <FeatureListModuleView
      {...featureListModule}
      section={{ brandVariant, layout, appearance }}
      titleId={`feature-list-${id}`}
      dataTestId={`feature-list-module-${id}`}
    />
  );
};
