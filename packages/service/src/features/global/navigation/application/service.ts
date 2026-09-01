import { getNavigation } from '@blog/service/features/global/navigation/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createNavigationService() {
  return {
    v1: {
      getNavigation: safeAsync((tenant?: TTenantSanityContext) =>
        getNavigation(tenant),
      ),
    },
  };
}
