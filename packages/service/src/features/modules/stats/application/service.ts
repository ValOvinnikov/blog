import { getStatsModule } from '@blog/service/features/modules/stats/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createStatsModuleService() {
  return {
    v1: {
      getStatsModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getStatsModule(id, tenant),
      ),
    },
  };
}
