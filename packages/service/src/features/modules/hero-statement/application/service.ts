import { getHeroStatement } from '@blog/service/features/modules/hero-statement/adaptor/loader';
import type { TTenantSanityContext } from '@blog/service/sanity/query';
import { safeAsync } from '@blog/utils';

export function createHeroStatementModuleService() {
  return {
    v1: {
      getHeroStatement: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroStatement(id, tenant),
      ),
    },
  };
}
