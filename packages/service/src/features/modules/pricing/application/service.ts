import { getPricingModule } from '@blog/service/features/modules/pricing/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query/query';
import { safeAsync } from '@blog/utils';

export function createPricingModuleService() {
  return {
    v1: {
      getPricingModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getPricingModule(id, tenant),
      ),
    },
  };
}
