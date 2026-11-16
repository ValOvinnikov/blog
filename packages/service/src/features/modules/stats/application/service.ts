import { getStatsModule } from '@shinefold/service/features/modules/stats/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createStatsModuleService() {
  return {
    v1: {
      getStatsModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getStatsModule(id, tenant),
      ),
    },
  };
}
