import { getFooter } from '@shinefold/service/features/global/footer/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createFooterService() {
  return {
    v1: {
      getFooter: safeAsync((tenant: TTenantSanityContext) => getFooter(tenant)),
    },
  };
}
