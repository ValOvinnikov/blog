import { getTimelineModule } from '@blog/service/features/modules/timeline/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTimelineModuleService() {
  return {
    v1: {
      getTimelineModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTimelineModule(id, tenant),
      ),
    },
  };
}
