import { getFeatureList } from '@blog/service/features/modules/feature-list/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createFeatureListModuleService() {
  return {
    v1: {
      getFeatureList: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getFeatureList(id, tenant),
      ),
    },
  };
}
