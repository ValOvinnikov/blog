import { getTaxonomyList } from '@blog/service/features/modules/taxonomy-list/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createTaxonomyListModuleService() {
  return {
    v1: { getTaxonomyList: safeAsync(getTaxonomyList) },
  };
}
