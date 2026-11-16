import { getFaqModule } from '@shinefold/service/features/modules/faq/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createFaqModuleService() {
  return {
    v1: {
      getFaqModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getFaqModule(id, tenant),
      ),
    },
  };
}
