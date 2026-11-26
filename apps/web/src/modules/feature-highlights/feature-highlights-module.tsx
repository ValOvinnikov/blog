import { service } from '@shinefold/service';
import { FEATURE_HIGHLIGHTS_LOG } from '@web/constants/feature-highlights';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { FeatureHighlightsModuleView } from './feature-highlights-module-view';

export interface IFeatureHighlightsModuleProps {
  id: string;
}

export const FeatureHighlightsModule = async ({
  id,
}: IFeatureHighlightsModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result =
    await service.modules.featureHighlights.v1.getFeatureHighlightsModule(
      id,
      sanityContext,
    );

  if (!result.ok) {
    logger.error(FEATURE_HIGHLIGHTS_LOG.MODULE_FETCH_FAILED, {
      id,
      error: result.error,
    });
    return null;
  }
  const { highlights, ...view } = result.data;

  return (
    <FeatureHighlightsModuleView
      {...view}
      highlights={highlights}
      titleId={`feature-highlights-${id}`}
      dataTestId={`feature-highlights-module-${id}`}
    />
  );
};
