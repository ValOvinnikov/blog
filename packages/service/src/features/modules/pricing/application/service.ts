import { getPricingModule } from '@shinefold/service/features/modules/pricing/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createPricingModuleService() {
  return {
    v1: {
      getPricingModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getPricingModule(id, tenant),
      ),
    },
  };
}
