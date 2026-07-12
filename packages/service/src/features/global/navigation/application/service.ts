import { getNavigation } from '@blog/service/features/global/navigation/adaptor/loader';
import { safeAsync } from '@blog/utils';

export function createNavigationService() {
  return {
    v1: {
      getNavigation: () => safeAsync(getNavigation()),
    },
  };
}
