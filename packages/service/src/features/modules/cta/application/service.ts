import { getCta } from '@shinefold/service/features/modules/cta/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createCtaModuleService() {
  return {
    v1: {
      getCta: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getCta(id, tenant),
      ),
    },
  };
}
