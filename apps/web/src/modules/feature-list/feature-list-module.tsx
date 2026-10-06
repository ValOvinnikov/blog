import { service } from '@blog/service';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { FeatureListModuleView } from './feature-list-module-view';

export interface IFeatureListModuleProps {
  id: string;
}

export const FeatureListModule = async ({ id }: IFeatureListModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.featureList.v1.getFeatureList(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error('feature_list_module.fetch_failed', {
      id,
      error: result.error,
    });
    return null;
  }

  return (
    <FeatureListModuleView
      {...result.data}
      titleId={`feature-list-${id}`}
      dataTestId={`feature-list-module-${id}`}
    />
  );
};
