import { getTaxonomyList } from '@blog/service/features/modules/taxonomy-list/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createTaxonomyListModuleService() {
  return {
    v1: {
      getTaxonomyList: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTaxonomyList(id, tenant),
      ),
    },
  };
}
