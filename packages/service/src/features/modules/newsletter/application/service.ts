import { getNewsletter } from '@blog/service/features/modules/newsletter/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createNewsletterModuleService() {
  return {
    v1: {
      getNewsletter: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getNewsletter(id, tenant),
      ),
    },
  };
}
