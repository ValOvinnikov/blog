import { getTimelineModule } from '@shinefold/service/features/modules/timeline/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTimelineModuleService() {
  return {
    v1: {
      getTimelineModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTimelineModule(id, tenant),
      ),
    },
  };
}
