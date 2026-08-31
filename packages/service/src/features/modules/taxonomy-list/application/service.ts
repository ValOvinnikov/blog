import type { TTaxonomyKind } from '@blog/config';
import { getTaxonomyList } from '@blog/service/features/modules/taxonomy-list/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTaxonomyListModuleService() {
  return {
    v1: {
      getTaxonomyList: safeAsync((id: string, taxonomy: TTaxonomyKind) =>
        getTaxonomyList(id, taxonomy),
      ),
    },
  };
}
