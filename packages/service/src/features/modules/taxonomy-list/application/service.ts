import { getTaxonomyList } from '@shinefold/service/features/modules/taxonomy-list/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTaxonomyListModuleService() {
  return {
    v1: {
      getTaxonomyList: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTaxonomyList(id, tenant),
      ),
    },
  };
}
