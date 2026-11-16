import { getTeamModule } from '@shinefold/service/features/modules/team/adaptor/loader';
import type { TTenantSanityContext } from '@shinefold/service/sanity/query/query';
import { safeAsync } from '@shinefold/utils';

export function createTeamModuleService() {
  return {
    v1: {
      getTeamModule: safeAsync((id: string, tenant: TTenantSanityContext) =>
        getTeamModule(id, tenant),
      ),
    },
  };
}
