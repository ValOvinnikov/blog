import { getDraftPagePath } from '@shinefold/service/features/pages/page-path/adaptor/loader';
import { safeAsync } from '@shinefold/utils';

export function createPagePathService() {
  return {
    v1: {
      getDraftPagePath: safeAsync(getDraftPagePath),
    },
  };
}
