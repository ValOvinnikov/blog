import { service } from '@blog/service';
import { getTenantSanityContext } from '@web/server/tenant/get-tenant-sanity-context';
import { logger } from '@web/utils/logger/logger';

import { StatsModuleView } from './stats-module-view';

export interface IStatsModuleProps {
  id: string;
  locale: string;
  tenant: string;
}

export const StatsModule = async ({ id, tenant }: IStatsModuleProps) => {
  const tenantContext = await getTenantSanityContext(tenant);
  const result = await service.modules.stats.v1.getStatsModule(
    id,
    tenantContext,
  );

  if (!result.ok) {
    logger.error('stats_module.fetch_failed', { id, error: result.error });
    return null;
  }
  if (result.data.stats.length === 0) return null;

  return (
    <StatsModuleView
      {...result.data}
      titleId={`stats-${id}`}
      dataTestId={`stats-module-${id}`}
    />
  );
};
