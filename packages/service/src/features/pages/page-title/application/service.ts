import { getPageTitle } from '@blog/service/features/pages/page-title/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createPageTitleService() {
  return {
    v1: {
      getPageTitle: safeAsync(getPageTitle),
    },
  };
}
