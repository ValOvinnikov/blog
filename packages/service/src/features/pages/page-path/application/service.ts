import { getDraftPagePath } from '@blog/service/features/pages/page-path/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createPagePathService() {
  return {
    v1: {
      getDraftPagePath: safeAsync(getDraftPagePath),
    },
  };
}
