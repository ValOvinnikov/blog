import { getHeroStatement } from '@shinefold/service/features/modules/hero-statement/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createHeroStatementModuleService() {
  return {
    v1: {
      getHeroStatement: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getHeroStatement(id, tenant),
      ),
    },
  };
}
