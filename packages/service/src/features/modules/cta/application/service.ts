import { getCta } from '@blog/service/features/modules/cta/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createCtaModuleService() {
  return {
    v1: {
      getCta: safeAsync((id: string, tenant?: TTenantSanityContext) =>
        getCta(id, tenant),
      ),
    },
  };
}
