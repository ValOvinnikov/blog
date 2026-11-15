import { service } from '@blog/service';
import { FEATURE_LIST_LOG } from '@web/constants/feature-list';
import { getRequestContext } from '@web/server/request-context/request-context';
import { getModuleSection } from '@web/server/site-config/get-module-section/get-module-section';
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

  const { section, content } = await getModuleSection(tenantId, result.data);

  return <FeatureListModuleView {...content} section={section} id={id} />;
};
