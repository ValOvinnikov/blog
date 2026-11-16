import { getNavigation } from '@shinefold/service/features/global/navigation/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createNavigationService() {
  return {
    v1: {
      getNavigation: safeAsync((tenant: TTenantSanityContext) =>
        getNavigation(tenant),
      ),
    },
  };
}
