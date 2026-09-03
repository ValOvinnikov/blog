import { getFooter } from '@blog/service/features/global/footer/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createFooterService() {
  return {
    v1: {
      getFooter: safeAsync((tenant: TTenantSanityContext) => getFooter(tenant)),
    },
  };
}
