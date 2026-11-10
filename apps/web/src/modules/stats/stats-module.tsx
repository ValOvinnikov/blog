import { service } from '@blog/service';
import { STATS_LOG } from '@web/constants/stats';
import { getRequestContext } from '@web/server/request-context/request-context';
import { logger } from '@web/utils/logger/logger';

import { StatsModuleView } from './stats-module-view';

export interface IStatsModuleProps {
  id: string;
}

export const StatsModule = async ({ id }: IStatsModuleProps) => {
  const { sanityContext } = await getRequestContext();
  const result = await service.modules.stats.v1.getStatsModule(
    id,
    sanityContext,
  );

  if (!result.ok) {
    logger.error(STATS_LOG.MODULE_FETCH_FAILED, { id, error: result.error });
    return null;
  }
  return (
    <StatsModuleView
      module={result.data}
      titleId={`stats-${id}`}
      dataTestId={`stats-module-${id}`}
    />
  );
};
