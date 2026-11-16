import { getPageTitle } from '@shinefold/service/features/pages/page-title/adaptor/loader';
import { safeAsync } from '@shinefold/utils';

export function createPageTitleService() {
  return {
    v1: {
      getPageTitle: safeAsync(getPageTitle),
    },
  };
}
