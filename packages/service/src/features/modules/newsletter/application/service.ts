import { getNewsletter } from '@shinefold/service/features/modules/newsletter/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createNewsletterModuleService() {
  return {
    v1: {
      getNewsletter: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getNewsletter(id, tenant),
      ),
    },
  };
}
