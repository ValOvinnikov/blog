import { safeAsync } from '@blog/utils';

import { getNavigation } from '../adaptor/loader';

export function createNavigationService() {
  return {
    v1: {
      getNavigation: () => safeAsync(getNavigation()),
    },
  };
}
