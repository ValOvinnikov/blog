import { service } from '@blog/service';
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
    logger.error('stats_module.fetch_failed', { id, error: result.error });
    return null;
  }
  return (
    <StatsModuleView
      {...result.data}
      titleId={`stats-${id}`}
      dataTestId={`stats-module-${id}`}
    />
  );
};
