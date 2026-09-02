import { getHomePage } from '@blog/service/features/pages/home/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createHomeService() {
  return {
    v1: {
      getHomePage: safeAsync((tenant: TTenantSanityContext) =>
        getHomePage(tenant),
      ),
    },
  };
}
