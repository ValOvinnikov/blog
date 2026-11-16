import { getFeatureList } from '@shinefold/service/features/modules/feature-list/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createFeatureListModuleService() {
  return {
    v1: {
      getFeatureList: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getFeatureList(id, tenant),
      ),
    },
  };
}
