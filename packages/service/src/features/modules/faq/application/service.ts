import { getFaqModule } from '@blog/service/features/modules/faq/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createFaqModuleService() {
  return {
    v1: {
      getFaqModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getFaqModule(id, tenant),
      ),
    },
  };
}
